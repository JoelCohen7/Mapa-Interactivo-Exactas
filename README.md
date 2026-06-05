# Mapa Interactivo FCEN-UBA

Página web interactiva para ubicarse dentro de la Facultad de Ciencias Exactas y Naturales de la UBA, en Ciudad Universitaria. Permite buscar espacios por nombre o sigla, navegar por pabellón y piso, y visualizar ubicaciones sobre los planos de la facultad.

## Sitio Online

👉 **Abrir el mapa:** <https://joelcohen7.github.io/Mapa-Interactivo-Exactas/>

## Qué Permite Hacer

- Buscar departamentos, institutos, secretarías, aulas y espacios comunes.
- Navegar por pabellón y piso.
- Ver marcadores diferenciados por categoría.
- Filtrar categorías desde la leyenda.
- Consultar y editar un diccionario de siglas como `INQUIMAE`, `QOR`, `DECA`, etc.
- Agregar, mover, editar o borrar ubicaciones desde el modo edición.
- Exportar/importar los datos del mapa en formato JSON.

## Estado Actual de los Datos

- 17 planos cargados.
- 23 ubicaciones iniciales.
- 33 siglas iniciales en el diccionario.
- 7 categorías de espacios.

Algunos marcadores tienen `"confianza": "aprox"` porque su posición fue estimada. Esas ubicaciones pueden corregirse arrastrando el marcador desde el modo edición.

## Cómo Usarlo Localmente

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000
```

Luego abrí:

```text
http://localhost:8000
```

Si el puerto `8000` está ocupado, usá otro:

```bash
python3 -m http.server 8001
```

También podés usar el script npm:

```bash
npm run dev
```

> No conviene abrir `index.html` con doble click: algunos navegadores bloquean la carga de `public/data.json` si no hay un servidor local.

## Cómo Se Actualizan las Ubicaciones

La app no escribe directamente en GitHub Pages. Los cambios se guardan primero en el navegador y después se publican actualizando `public/data.json`.

Flujo recomendado:

1. Abrí el mapa localmente.
2. Activá `✏️ Modo edición`.
3. Agregá, mové o corregí ubicaciones.
4. Usá `⤓ Exportar JSON`.
5. Reemplazá `public/data.json` con el archivo exportado.
6. Hacé commit y push a `main`.
7. GitHub Pages publica automáticamente la nueva versión.

## Guardado Local Opcional

Si tenés Node.js >= 18, podés levantar un servidor local que permite guardar directamente sobre `public/data.json`:

```bash
npm run dev:save
```

Luego abrí:

```text
http://localhost:3001
```

Con ese servidor activo aparece el botón `☁ Guardar en servidor` dentro de la app.

## Publicación en GitHub Pages

El repositorio está configurado para publicarse automáticamente con GitHub Actions.

- Workflow: `.github/workflows/deploy-pages.yml`
- Rama de publicación: `main`
- Sitio publicado: <https://joelcohen7.github.io/Mapa-Interactivo-Exactas/>

Para activar o revisar la configuración en GitHub:

1. Entrar a `Settings → Pages`.
2. En `Build and deployment`, seleccionar `Source: GitHub Actions`.
3. Hacer push a `main`.
4. Revisar el deploy desde la pestaña `Actions`.

Más detalles en `docs/GITHUB_PAGES.md`.

## Estructura del Repositorio

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

## Documentación Técnica

- `docs/DATA_MODEL.md`: estructura de `public/data.json`.
- `docs/CONTRIBUTING.md`: flujo para agregar o corregir ubicaciones.
- `docs/GITHUB_PAGES.md`: guía de publicación en GitHub Pages.

## Tecnologías

- HTML, CSS y JavaScript vanilla.
- Leaflet con `CRS.Simple` para mostrar planos como mapas navegables.
- GitHub Pages para hosting estático.
- GitHub Actions para deploy automático.

## Licencia

Este proyecto usa la licencia indicada en `LICENSE`.
