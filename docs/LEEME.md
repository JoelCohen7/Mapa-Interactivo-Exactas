# Notas del paquete inicial

Este archivo conserva el contexto original del proyecto. La estructura actual ya fue reorganizada y documentada en `README.md`.

## Qué contiene hoy el repo

- `index.html` → entrada del sitio estático.
- `assets/css/styles.css` → estilos.
- `assets/js/app.js` → lógica del mapa, búsqueda, edición e importación/exportación.
- `public/vendor/leaflet/` → Leaflet incluido localmente.
- `public/planos/` → 17 planos, uno por piso.
- `public/data.json` → datos iniciales: categorías, pisos, diccionario de siglas y marcadores.
- `tools/server.js` → servidor local opcional para guardar datos sin dependencias externas.
- `docs/PROMPT_PARA_CLAUDE_CODE.md` → prompt histórico usado para generar la base inicial.

## Probar localmente

```bash
python3 -m http.server 8000
```

Abrí `http://localhost:8000`.

## Sobre los datos

- `x` e `y` de cada marcador son fracciones de 0 a 1 sobre la imagen del piso.
- Los marcadores con `"confianza": "aprox"` tienen posición estimada.
- El diccionario de siglas salió de las leyendas de los planos y puede completarse desde la app.

## Publicar cambios

La app guarda ediciones en el navegador y permite exportar el JSON actualizado. Para publicar cambios, reemplazá `public/data.json`, commiteá y pusheá a `main`. GitHub Pages se actualiza mediante el workflow incluido.
