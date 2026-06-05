# Modelo de datos

El archivo `public/data.json` contiene toda la información editable del mapa. La aplicación lo carga al iniciar y puede exportarlo nuevamente desde la interfaz.

## Estructura general

```json
{
  "meta": {},
  "categorias": {},
  "diccionario": [],
  "pisos": [],
  "entradas": []
}
```

## `meta`

Metadatos descriptivos del dataset:

- `titulo`: nombre público del mapa.
- `descripcion`: resumen del alcance.
- `fuente`: origen de planos y referencias.
- `version`: número interno del formato.
- `nota`: aclaraciones sobre precisión u origen de datos.

## `categorias`

Diccionario de categorías visuales. Cada clave se usa como `tipo` en `entradas` y `diccionario`.

```json
"instituto": {
  "label": "Instituto de investigación",
  "color": "#a855f7"
}
```

Campos:

- `label`: texto mostrado en la leyenda y popups.
- `color`: color hexadecimal del marcador.

## `diccionario`

Lista de siglas y nombres completos. El buscador usa estos datos para encontrar espacios aunque la entrada tenga solo una sigla como alias.

```json
{
  "codigo": "INQUIMAE",
  "nombre": "Instituto de Química de los Materiales, Medio Ambiente y Energía",
  "tipo": "instituto"
}
```

Campos:

- `codigo`: sigla en mayúsculas.
- `nombre`: nombre completo.
- `tipo`: clave existente en `categorias`.

## `pisos`

Lista de planos disponibles.

```json
{
  "id": "pab2-piso1",
  "pabellon": "Pabellón 2",
  "piso": "Piso 1",
  "imagen": "planos/pab2-piso1.png"
}
```

Campos:

- `id`: identificador único del piso.
- `pabellon`: nombre usado para agrupar en el selector.
- `piso`: etiqueta visible del piso.
- `imagen`: ruta relativa a `public/`.

## `entradas`

Marcadores ubicados sobre un piso.

```json
{
  "id": "e-inquimae",
  "nombre": "INQUIMAE",
  "tipo": "instituto",
  "alias": ["INQUIMAE"],
  "descripcion": "Instituto de investigación",
  "pisoId": "pab2-piso1",
  "x": 0.42,
  "y": 0.37,
  "confianza": "aprox"
}
```

Campos:

- `id`: identificador único de la entrada.
- `nombre`: texto principal del popup y resultados.
- `tipo`: clave existente en `categorias`.
- `alias`: lista opcional de siglas o nombres alternativos.
- `descripcion`: texto opcional para el popup.
- `pisoId`: `id` de un elemento de `pisos`.
- `x`: posición horizontal como fracción de 0 a 1, desde la izquierda.
- `y`: posición vertical como fracción de 0 a 1, desde arriba.
- `confianza`: `exacta` o `aprox`.

## Reglas de consistencia

- Todo `pisoId` de `entradas` debe existir en `pisos`.
- Todo `tipo` debe existir en `categorias`.
- Las coordenadas `x` e `y` deben estar entre `0` y `1`.
- Las rutas de imágenes deben existir dentro de `public/`.
- Las siglas del diccionario deberían escribirse en mayúsculas para mejorar la búsqueda.
