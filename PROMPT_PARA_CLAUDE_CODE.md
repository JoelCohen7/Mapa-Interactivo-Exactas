# Prompt para Claude Code

> Copiá y pegá TODO lo que está debajo de la línea en Claude Code, dentro de la carpeta del proyecto `mapa-exactas/`.
> En esa carpeta ya están: `public/planos/` (17 imágenes de planos) y `public/data.json` (datos iniciales). **No los regeneres**: construí la app alrededor de ellos.
>
> **Ya hay una base funcional** que arranca sola: `index.html`, `styles.css`, `app.js` y Leaflet vendorizado en `public/vendor/leaflet/`. Esa base ya hace: visor de pisos con zoom, marcadores por categoría, búsqueda global, modo edición (agregar/mover/borrar/editar) y exportar/importar JSON. **Tu trabajo es revisarla, mejorarla y completar lo que falte** según los requisitos de abajo (no empieces de cero). Probala primero con `python3 -m http.server 8000`.
>
> Pendientes conocidos a mejorar: edición del diccionario de siglas desde la UI; agrupar resultados de búsqueda por pabellón; pulido visual y responsive; (opcional) script de OCR y mini servidor de guardado.

---

Quiero una aplicación web de **mapa interactivo de la Facultad de Ciencias Exactas y Naturales (FCEN-UBA)** que me permita **buscar** un departamento, instituto, secretaría, aula, laboratorio o cualquier espacio, y que me lo **marque sobre el plano** del pabellón y piso correspondiente. Además quiero poder **editar, agregar y borrar** la información de cada espacio.

## Contexto y archivos que ya existen

- `public/planos/*.png` → 17 imágenes, una por piso. Los nombres siguen el patrón `pabX-piso.png` (ej: `pab2-piso3.png`).
- `public/data.json` → datos iniciales con esta estructura:
  - `meta`: título y notas.
  - `categorias`: objeto `{ clave: { label, color } }` (secretaria, departamento, instituto, carrera, tecnica, comun, otro). El color define el color del marcador.
  - `diccionario`: lista de siglas → nombre completo y tipo (ej: `{ "codigo": "INQUIMAE", "nombre": "...", "tipo": "instituto" }`). Sirve para que la búsqueda entienda las siglas.
  - `pisos`: lista de `{ id, pabellon, piso, imagen }`. `imagen` es la ruta relativa al PNG.
  - `entradas`: lista de marcadores `{ id, nombre, alias[], descripcion, tipo, pisoId, x, y, confianza }`. **`x` e `y` son fracciones de 0 a 1** respecto del ancho/alto de la imagen del piso (resolución-independiente). `confianza: "aprox"` significa que la posición fue estimada y la voy a ajustar yo.

## Stack y requisitos técnicos (importante)

- **Sitio 100% estático, sin paso de build y sin backend.** Solo `index.html`, `app.js`, `styles.css` y la carpeta `public/`. Tiene que poder servirse con cualquier servidor estático simple (por ejemplo `python3 -m http.server`) o un nginx, porque lo voy a hostear en una máquina lenta.
- Usá **Leaflet** (desde CDN, ej. unpkg) con `L.CRS.Simple` y `L.imageOverlay` para mostrar cada plano como un mapa con **zoom y paneo**. Los marcadores deben ubicarse convirtiendo `(x,y)` fracción → coordenadas de pixel usando el tamaño natural de cada imagen.
- **No uses localStorage/sessionStorage como única persistencia obligatoria del framework**, pero sí podés usar `localStorage` como copia de trabajo del usuario (ver Persistencia). Todo el resto del estado en variables JS / estado de la app.
- Rutas siempre **relativas** (nada de rutas absolutas tipo `/home/...` ni `http://localhost`). Así funciona igual en mi máquina y en el host.
- Que ande bien en celular y en escritorio (layout responsive).
- Código comentado en español y prolijo.

## Funcionalidades

### 1. Visor de planos
- Selector en dos niveles: **Pabellón** y luego **Piso** (agrupá los pisos por pabellón según `data.json`). Al cambiar de piso, se carga la imagen correspondiente en el mapa.
- Mostrar el título del piso actual (ej: "Pabellón 2 · Piso 3").
- Cada `entrada` de ese piso se dibuja como un **marcador** con el color de su categoría y, al pasar el mouse / tocar, un tooltip con el nombre. Al hacer click, un popup con: nombre, tipo (label de la categoría), alias, descripción, y un botón **Editar**.
- Las entradas con `confianza: "aprox"` deben verse distintas (por ejemplo borde punteado o un ícono de advertencia) para recordarme que tengo que ajustar la posición.

### 2. Búsqueda (lo central)
- Caja de búsqueda que filtra en **todos los pisos a la vez**, no solo el actual.
- Debe matchear contra: `nombre`, `alias`, `descripcion`, y también contra el `diccionario` (si escribo "INQUIMAE" o "química orgánica" debe encontrarlo aunque el marcador diga solo la sigla).
- Resultados como lista debajo de la caja, agrupados o etiquetados por pabellón/piso. Al hacer click en un resultado: cambia al piso correcto, hace `flyTo`/centra en el marcador y lo **resalta** (animación o pulso unos segundos).
- Si un término del diccionario no tiene ningún marcador en ningún piso, mostralo igual en los resultados con una nota tipo "sin ubicación marcada — agregá una".

### 3. Filtros y leyenda
- Leyenda con las categorías (color + label).
- Checkboxes para mostrar/ocultar categorías en el mapa.

### 4. Edición (modo edición)
Un botón **"Modo edición"** que activa/desactiva. Con el modo edición activo:
- **Agregar entrada:** botón "Agregar"; después hago click en el punto del plano donde va, y se abre un formulario (nombre, tipo = select de categorías, alias separados por coma, descripción). Se crea con la posición donde cliqueé y `confianza: "exacta"`.
- **Editar entrada:** desde el popup del marcador o desde la lista; formulario con los mismos campos.
- **Mover entrada:** los marcadores son **arrastrables**; al soltarlos se actualizan `x` e `y` (y pasa a `confianza: "exacta"`).
- **Borrar entrada:** botón en el formulario/popup con confirmación.
- Que también pueda **editar el diccionario** (agregar/editar/borrar siglas) desde algún panel, porque hay institutos o áreas que no figuran en las leyendas originales.

### 5. Persistencia y publicación
- Al iniciar, la app carga `public/data.json`. Si hay una copia editada en `localStorage`, usá esa (con un cartelito "tenés cambios sin publicar" y un botón "Descartar cambios locales").
- Cada cambio (agregar/editar/borrar/mover) se guarda automáticamente en `localStorage`.
- Botón **"Exportar JSON"** que descarga el `data.json` actualizado.
- Botón **"Importar JSON"** para cargar un archivo.
- Explicá en un `README` corto cómo **publicar** los cambios: reemplazar `public/data.json` por el exportado y volver a desplegar/copiar al host.
- (Opcional, en una sección aparte y claramente separada) Si querés, agregá un mini servidor opcional en Node/Express (`server.js`) con un endpoint `POST /guardar` que escriba `public/data.json`, y un botón "Guardar en servidor" que solo aparezca si ese server está corriendo. Esto es **opcional**; la app debe funcionar perfectamente sin él.

## Calidad y diseño
- Interfaz limpia tipo "panel lateral + mapa". Tipografía legible, buen contraste, controles claros en español.
- Asegurate de que la conversión de coordenadas funcione aunque las imágenes tengan distinto tamaño entre sí (leé el tamaño natural de cada imagen al cargarla).
- Probá la búsqueda, el cambio de pisos, agregar/mover/borrar y exportar/importar antes de darlo por terminado.

## (Opcional) Mejorar los datos automáticamente
Los rótulos de los planos están "quemados" dentro de las imágenes (no son texto), por eso `data.json` trae solo las siglas de las leyendas y algunos marcadores aproximados. Si querés, podés intentar una pasada de OCR (tesseract) o de visión sobre los PNG para proponer más entradas, **pero dejalo como un script aparte** (ej: `scripts/ocr.js`) que genere un `data.sugerido.json`; no bloquees la app con eso y no pisi `data.json`.

---

**Empezá creando la estructura del proyecto y el `index.html` con Leaflet, después la carga de `data.json` y el visor de pisos, después la búsqueda, y por último el modo edición y exportar/importar.**
