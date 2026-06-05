# Mapa interactivo FCEN-UBA — paquete inicial

Este paquete contiene los datos de arranque para que Claude Code construya la app.

## Qué hay acá
- `index.html`, `styles.css`, `app.js` → **app base ya funcional** (visor, búsqueda, edición, exportar/importar).
- `public/vendor/leaflet/` → Leaflet incluido localmente (anda sin internet).
- `public/planos/` → 17 planos (uno por piso), extraídos del PowerPoint.
- `public/data.json` → datos iniciales: diccionario de siglas, lista de pisos y marcadores aproximados.
- `PROMPT_PARA_CLAUDE_CODE.md` → el prompt para que Claude Code la mejore/complete.

## Probarla ya mismo (sin Claude Code)
```bash
cd mapa-exactas
python3 -m http.server 8000
```
Abrí http://localhost:8000 — ya deberías ver los planos, buscar y editar.

## Cómo usarlo
1. Abrí esta carpeta (`mapa-exactas/`) como proyecto en VS Code.
2. Abrí Claude Code y pegale el contenido de `PROMPT_PARA_CLAUDE_CODE.md`.
3. Cuando termine, probá la app con un servidor estático, por ejemplo:
   ```bash
   cd mapa-exactas
   python3 -m http.server 8000
   ```
   y entrá a http://localhost:8000

## Sobre los datos
- `x` e `y` de cada marcador son fracciones de 0 a 1 sobre la imagen del piso.
- Los marcadores con `"confianza": "aprox"` tienen posición estimada: ajustalos arrastrándolos en el modo edición de la app.
- El diccionario de siglas (DECA, INQUIMAE, QOR, etc.) salió de las leyendas de los planos. Hay institutos/áreas que no figuran en esas leyendas: agregalos vos desde la app.

## Publicar cambios
La app guarda tus ediciones en el navegador (localStorage) y te deja **Exportar JSON**.
Para publicar: reemplazá `public/data.json` por el archivo exportado y volvé a copiar la carpeta al servidor.
