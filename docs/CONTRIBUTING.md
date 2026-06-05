# Guía de mantenimiento

Esta guía describe el flujo recomendado para mejorar el mapa sin romper la publicación estática.

## Corregir o agregar una ubicación

1. Levantá el sitio localmente con `python3 -m http.server 8000`.
2. Abrí `http://localhost:8000`.
3. Activá `✏️ Modo edición`.
4. Para corregir: arrastrá el marcador o abrí su popup y elegí `Editar`.
5. Para agregar: usá `＋ Agregar espacio` y hacé click sobre el plano.
6. Exportá con `⤓ Exportar JSON`.
7. Reemplazá `public/data.json` con el JSON exportado.
8. Verificá el cambio localmente antes de commitear.

## Usar guardado directo local

Si tenés Node.js >= 18, podés usar el servidor opcional:

```bash
npm run dev:save
```

Entrá a `http://localhost:3001`. La app detecta el servidor y muestra `☁ Guardar en servidor`, que escribe directamente sobre `public/data.json`.

## Agregar un plano nuevo

1. Guardá la imagen en `public/planos/`.
2. Agregá una entrada en `pisos` dentro de `public/data.json`.
3. Usá una ruta relativa a `public/`, por ejemplo `planos/pab2-piso5.png`.
4. Abrí la app y verificá que el selector muestre el nuevo piso.
5. Agregá marcadores desde el modo edición.

## Buenas prácticas de datos

- Usá nombres claros y siglas como alias cuando correspondan.
- Marcá como `aprox` todo punto que no haya sido verificado en el plano.
- Pasá a `exacta` solo cuando la ubicación haya sido revisada.
- Evitá duplicar entradas: preferí agregar alias o completar el diccionario.
- Mantené los IDs estables si una entrada ya fue publicada.

## Antes de publicar

```bash
python3 -m json.tool public/data.json >/tmp/mapa-fcen-data.json
python3 -m http.server 8000
```

Luego revisá manualmente:

- El mapa carga sin errores.
- Los selectores de pabellón y piso funcionan.
- La búsqueda encuentra nombres y siglas esperadas.
- Los marcadores modificados aparecen en el piso correcto.
