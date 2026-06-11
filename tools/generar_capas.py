#!/usr/bin/env python3
"""
Generador de capas para el mapa interactivo FCEN.

Toma los PDF de "Bocas" (que traen las capas CAD como OCGs) y, por cada piso,
exporta un PNG transparente por cada grupo de capa, todos recortados y escalados
al mismo encuadre que el plano coloreado actual (para que los marcadores —que se
guardan como fracciones 0..1 de ese plano— sigan alineados).

Salida:
  public/capas/<pisoId>/base_arq.png      (fondo arquitectura B/N del PDF)
  public/capas/<pisoId>/<layerId>.png     (cada capa de red, transparente)
  public/capas/<pisoId>/manifest.json     (qué capas se generaron, para data.json)

Requisitos: pikepdf, Pillow, y pdftocairo (poppler) en el PATH.

Uso:
  python3 tools/generar_capas.py [pisoId ...]
  (sin argumentos procesa todos los pisos de la config)
"""

import pikepdf, subprocess, os, sys, json
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANOS = os.path.join(RAIZ, "Planos")
PUBLIC = os.path.join(RAIZ, "public")
REF_DPI = 200  # resolución de render del PDF antes de recortar/escalar

# --- Taxonomía de capas: layerId -> (label, color, [nombres de OCG]) -------
# Los nombres se matchean exactos, sin distinguir mayúsculas/acentos sobrantes.
ARQUITECTURA = {"_prefijos": ("ARQ_", "EST_"),
                "_extra": {"MUROS", "COLUMNAS", "TABIQUES NUEVOS",
                           "A-MUROS EXIST.", "A-TABIQUES NUEVOS",
                           "A-TABQ. PERFILERIA EXIST.", "A-DURLOCK", "BARRIDO PUERTAS"}}

CAPAS = {
    "bocas_datos":      ("Bocas Datos",        "#2563eb", ["E-BOCAS DATOS", "E-TEXTO BOCAS -  DATOS"]),
    "bocas_tel_ip":     ("Bocas Tel IP",       "#16a34a", ["E-BOCAS TEL IP", "E-TEXTO BOCAS - TEL IP"]),
    "bocas_tel_analog": ("Bocas Tel Analógico","#9333ea", ["E-BOCAS TEL ANALOGICO", "E-TEXTO BOCAS - TEL ANALOG"]),
    "bocas_tel_emerg":  ("Bocas Tel Emergencia","#dc2626",["E-BOCAS TEL EMERGENCIA"]),
    "fibra":            ("Fibra óptica",       "#ea580c", ["E-FO CLARO", "E-FIBRA O W"]),
    "bandejas":         ("Bandejas",           "#0891b2", ["E-BANDEJA", "E-ACCESORIOS DE BANDEJA", "E-NIVEL BANDEJAS"]),
    "cable_canal":      ("Cable canal",        "#ca8a04", ["E-CABLE CANAL"]),
    "canos":            ("Caños",              "#65a30d", ["E-CAÑO CORRUGADO", "E-CAÑO SIMPLE"]),
    "racks":            ("Racks",              "#be123c", ["E-RACK", "E-DIVISIÓN DE RACKS"]),
    "montantes":        ("Montantes / verticales","#7c3aed",["E-MONTANTE", "E-PASE VERT"]),
    "pases":            ("Pases",              "#0d9488", ["E-PASE D", "E-PASE M", "E-PASE DE CH", "E-PASE VIDRIO"]),
    "cajas":            ("Cajas",              "#db2777", ["E-CAJAS W"]),
    "arquetas":         ("Arquetas / postes",  "#737373", ["E-ARQUETAS", "E-POSTE TELEF"]),
    "sanitarios":       ("Sanitarios",         "#0284c7", ["SANIT", "SANIT-INT"]),
}

# --- Config por piso --------------------------------------------------------
# crop: [x0,y0,x1,y1] en px del render a REF_DPI. None = autodetectar por muros.
FLOORS = {
    "pab1-piso2": {
        "pdf":  os.path.join(PLANOS, "Pab1", "Pab1-Bocas (2016).pdf"),
        "page": 1,  # 2°Piso
        "colored": os.path.join(PUBLIC, "planos", "pab1-piso2.png"),
        "crop": [132, 674, 2698, 1627],  # calibrado: muros alinean con el plano coloreado
    },
}


def norm(s):
    return s.strip().upper()


def es_arquitectura(nombre):
    n = norm(nombre)
    return n.startswith(ARQUITECTURA["_prefijos"]) or n in ARQUITECTURA["_extra"]


def render(pdf_path, page, predicado, dpi=REF_DPI, transp=True):
    """Renderiza el PDF dejando visibles solo las capas para las que
    predicado(nombre)=True. transp=True -> fondo transparente (capas);
    transp=False -> fondo blanco opaco (plano base). Devuelve RGBA."""
    p = pikepdf.open(pdf_path)
    on, off = [], []
    for ocg in p.Root.OCProperties.OCGs:
        (on if predicado(str(ocg.Name)) else off).append(ocg)
    D = p.Root.OCProperties.D
    D.ON = pikepdf.Array(on)
    D.OFF = pikepdf.Array(off)
    tmp = f"/tmp/_capa_{os.getpid()}.pdf"
    p.save(tmp); p.close()
    base = f"/tmp/_capa_{os.getpid()}"
    cmd = ["pdftocairo", "-png", "-r", str(dpi),
           "-f", str(page), "-l", str(page), "-singlefile", tmp, base]
    if transp:
        cmd.insert(3, "-transp")
    subprocess.run(cmd, capture_output=True)
    img = Image.open(base + ".png").convert("RGBA")
    os.remove(tmp); os.remove(base + ".png")
    return img


def matcher(nombres):
    objetivo = {norm(x) for x in nombres}
    return lambda nombre: norm(nombre) in objetivo


def build_floor(piso_id, cfg):
    print(f"\n=== {piso_id} ===")
    salida = os.path.join(PUBLIC, "capas", piso_id)
    os.makedirs(salida, exist_ok=True)

    color = Image.open(cfg["colored"]).convert("RGBA")
    W, H = color.size
    print(f"  encuadre destino (plano coloreado): {W}x{H}")

    # 1) Determinar recorte del edificio en el PDF
    crop = cfg.get("crop")
    if crop is None:
        muros = render(cfg["pdf"], cfg["page"],
                       lambda n: norm(n) in {"ARQ_MUROS", "EST_COLUMNAS", "ARQ_PUERTAS",
                                             "MUROS", "COLUMNAS"})
        crop = muros.getbbox()
        print(f"  recorte autodetectado (muros): {crop}")
    else:
        print(f"  recorte manual: {crop}")

    def exportar(nombre_archivo, predicado, transp=True):
        img = render(cfg["pdf"], cfg["page"], predicado, transp=transp)
        img = img.crop(crop).resize((W, H))
        if transp and not img.getbbox():
            return False  # capa vacía en este piso
        img.save(os.path.join(salida, nombre_archivo))
        return True

    # 2) Fondo arquitectura (opaco, blanco — es un plano base)
    exportar("base_arq.png", es_arquitectura, transp=False)
    print("  base_arq.png ✓")

    # 3) Capas de red (solo las no vacías)
    generadas = []
    for lid, (label, colorhex, nombres) in CAPAS.items():
        if exportar(f"{lid}.png", matcher(nombres)):
            generadas.append({"id": lid, "label": label, "color": colorhex,
                              "imagen": f"capas/{piso_id}/{lid}.png"})
            print(f"  {lid}.png ✓")
        else:
            print(f"  {lid} — vacía, se omite")

    manifest = {
        "pisoId": piso_id,
        "crop": list(crop),
        "base_arq": f"capas/{piso_id}/base_arq.png",
        "capas": generadas,
    }
    with open(os.path.join(salida, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"  manifest.json ✓ ({len(generadas)} capas)")
    return manifest


def main():
    pedidos = sys.argv[1:] or list(FLOORS.keys())
    for pid in pedidos:
        if pid not in FLOORS:
            print(f"!! {pid} no está en la config, lo salto")
            continue
        build_floor(pid, FLOORS[pid])


if __name__ == "__main__":
    main()
