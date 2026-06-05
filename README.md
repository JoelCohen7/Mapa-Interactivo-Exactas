# Mapa Interactivo FCEN-UBA

Página web estática para orientarse dentro de la Facultad de Ciencias Exactas y Naturales de la UBA (Ciudad Universitaria). Permite buscar espacios por nombre o sigla, navegar por pabellón/piso y ajustar marcadores sobre los planos.

El sitio no necesita backend para publicarse: funciona directamente en GitHub Pages con archivos estáticos.

## Funcionalidades

- Búsqueda global de departamentos, institutos, secretarías, aulas y espacios comunes.
- Navegación por pabellón y piso sobre planos de FCEN.
- Marcadores por categoría con leyenda filtrable.
- Diccionario editable de siglas como `INQUIMAE`, `QOR`, `DECA`, etc.
- Modo edición para agregar, mover, editar o borrar ubicaciones.
- Exportación/importación de `public/data.json` para publicar cambios.
- Servidor local opcional para guardar el JSON sin reemplazarlo manualmente.

## Estado de los datos

- 17 planos cargados.
- 23 ubicaciones iniciales.
- 33 siglas iniciales en el diccionario.
- 7 categorías de espacios.

Los marcadores con `"confianza": "aprox"` tienen una posición estimada y deberían ajustarse desde el modo edición.

## Estructura del repositorio

```text
.
├── .github/workflows/deploy-pages.yml  # publicación automática en GitHub Pages
├── assets/
│   ├── css/styles.css                  # estilos de la interfaz
│   └── js/app.js                       # lógica del mapa, búsqueda y edición
├── docs/
│   ├── CONTRIBUTING.md                 # guía para mantener datos y planos
│   ├── DATA_MODEL.md                   # formato de public/data.json
│   ├── GITHUB_PAGES.md                 # pasos de publicación
│   ├── LEEME.md                        # notas del paquete inicial
│   └── PROMPT_PARA_CLAUDE_CODE.md      # prompt histórico del proyecto
├── public/
│   ├── data.json                       # pisos, marcadores, categorías y siglas
│   ├── planos/                         # imágenes de planos por piso
│   └── vendor/leaflet/                 # Leaflet vendorizado
├── tools/server.js                     # servidor local opcional de edición
├── index.html                          # entrada del sitio estático
├── package.json                        # scripts útiles, sin dependencias
└── README.md
```

## Uso local

Con Python:

```bash
python3 -m http.server 8000
```

Abrí `http://localhost:8000`.

Con npm, si tenés Node.js:

```bash
npm run dev
```

## Edición de datos

La app guarda los cambios en `localStorage` del navegador. Para convertirlos en cambios publicados:

1. Activá `✏️ Modo edición`.
2. Agregá, mové o editá marcadores y siglas.
3. Usá `⤓ Exportar JSON`.
4. Reemplazá `public/data.json` por el archivo exportado.
5. Commiteá y pusheá el cambio.

Para guardar directamente en `public/data.json` durante desarrollo local:

```bash
npm run dev:save
```

Abrí `http://localhost:3001`; aparecerá el botón `☁ Guardar en servidor`.

## Publicación en GitHub Pages

El repositorio ya incluye un workflow en `.github/workflows/deploy-pages.yml`. Al pushear a `main`, GitHub Actions publica el sitio en Pages.

Configuración recomendada:

1. En GitHub, entrá a `Settings → Pages`.
2. En `Build and deployment`, elegí `Source: GitHub Actions`.
3. Pusheá a `main`.
4. Esperá a que termine la action `Deploy static site to GitHub Pages`.

Más detalles en `docs/GITHUB_PAGES.md`.

## Mantenimiento

- Formato de datos: `docs/DATA_MODEL.md`.
- Flujo para agregar o corregir ubicaciones: `docs/CONTRIBUTING.md`.
- Los assets de Leaflet están en el repo para que el mapa funcione sin CDNs externos.

## Licencia

Este proyecto usa la licencia indicada en `LICENSE`.
