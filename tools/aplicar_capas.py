#!/usr/bin/env python3
"""
Lee los manifest.json generados por generar_capas.py y los inyecta en
public/data.json: a cada piso con manifest le agrega `bases` (coloreado +
arquitectura PDF) y `capas` (lista de capas de red apilables).

Idempotente: re-ejecutar sobrescribe esos campos en los pisos afectados.

Uso: python3 tools/aplicar_capas.py
"""
import json, os, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(RAIZ, "public")
DATA = os.path.join(PUBLIC, "data.json")

data = json.load(open(DATA, encoding="utf-8"))
pisos = {p["id"]: p for p in data["pisos"]}

aplicados = 0
for manifest_path in glob.glob(os.path.join(PUBLIC, "capas", "*", "manifest.json")):
    m = json.load(open(manifest_path, encoding="utf-8"))
    pid = m["pisoId"]
    if pid not in pisos:
        print(f"!! {pid}: no existe en data.json, lo salto")
        continue
    piso = pisos[pid]
    piso["bases"] = [
        {"id": "color", "label": "Coloreado", "imagen": piso["imagen"]},
        {"id": "arq",   "label": "Arquitectura", "imagen": m["base_arq"]},
    ]
    piso["capas"] = m["capas"]
    aplicados += 1
    print(f"  {pid}: {len(m['capas'])} capas aplicadas")

json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"\ndata.json actualizado ({aplicados} pisos con capas).")
