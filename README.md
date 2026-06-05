# Mapa interactivo FCEN-UBA

Buscador de espacios (departamentos, institutos, secretarías, aulas) sobre los planos
por pabellón y piso. Sitio 100% estático, sin build.

## Levantar localmente

```bash
cd mapa-exactas
python3 -m http.server 8000
# → abrí http://localhost:8000
```

## Cómo publicar cambios

Los cambios que hacés en la app (agregar/mover/borrar marcadores, editar el diccionario)
se guardan automáticamente en el navegador (localStorage).

Para que queden publicados para todos:

1. En la app, hacé click en **⤓ Exportar JSON**.
2. Reemplazá `public/data.json` por el archivo descargado.
3. Copiá la carpeta `mapa-exactas/` (o solo el `data.json` actualizado) al servidor/host.
4. Recargá la página — todos verán los datos nuevos.

> El botón "Descartar cambios locales" descarta tu copia de trabajo y vuelve
> a cargar el `data.json` publicado en el servidor.

## Ajustar marcadores aproximados

Los marcadores con borde punteado tienen `"confianza": "aprox"` — la posición fue estimada.
Para ajustarlos:

1. Activá **✏️ Modo edición**.
2. Arrastrá los marcadores punteados a su posición correcta.
3. Exportá y publicá el JSON actualizado.

## Diccionario de siglas

El botón **📖 Diccionario de siglas** abre un panel para agregar, editar o borrar
las siglas (DECA, QOR, INQUIMAE, etc.). El buscador global usa ese diccionario para
encontrar espacios aunque el marcador solo tenga la sigla.

## Servidor opcional (para guardar sin reemplazar archivos a mano)

Si tenés Node.js, podés usar el servidor incluido que expone un endpoint `POST /guardar`:

```bash
npm install express
node server.js
# → abrí http://localhost:3001
```

Con el servidor corriendo aparece el botón **☁ Guardar en servidor** en la app,
que escribe `public/data.json` directamente (sin necesidad de exportar/reemplazar a mano).

## Estructura

```
mapa-exactas/
├── index.html          interfaz principal
├── app.js              lógica de la app
├── styles.css          estilos
├── server.js           servidor opcional (Node/Express)
├── public/
│   ├── data.json       datos: pisos, marcadores, diccionario
│   ├── planos/         17 imágenes de planos (pabX-piso.png)
│   └── vendor/leaflet/ Leaflet vendorizado (no necesita internet)
└── README.md
```
