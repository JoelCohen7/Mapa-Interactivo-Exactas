# Publicación con GitHub Pages

El proyecto está preparado para publicarse como sitio estático en GitHub Pages usando GitHub Actions.

## Configuración inicial

1. Subí el repositorio a GitHub.
2. Entrá a `Settings → Pages`.
3. En `Build and deployment`, seleccioná `Source: GitHub Actions`.
4. Guardá la configuración si GitHub lo solicita.
5. Hacé push a la rama `main`.

El workflow `.github/workflows/deploy-pages.yml` copia al artefacto público solamente:

- `index.html`
- `assets/`
- `public/`
- `.nojekyll`

Eso evita publicar documentación, herramientas locales o archivos internos que no son parte del sitio.

## URL esperada

Para un repositorio de usuario u organización:

```text
https://USUARIO.github.io/NOMBRE_DEL_REPO/
```

Si configurás un dominio propio, agregá un archivo `CNAME` en la raíz con el dominio y verificá la configuración DNS en GitHub.
El workflow lo copia automáticamente al artefacto publicado si el archivo existe.

## Actualizar la página publicada

Cada push a `main` dispara una publicación nueva. El caso más común es actualizar datos:

1. Editá ubicaciones desde la app local.
2. Exportá el JSON.
3. Reemplazá `public/data.json`.
4. Commit y push a `main`.

## Solución de problemas

- Si la action no corre, revisá que GitHub Pages esté configurado con `Source: GitHub Actions`.
- Si el mapa carga pero no aparecen planos, verificá rutas dentro de `public/data.json`.
- Si los cambios de datos no se ven, forzá recarga del navegador o probá en una ventana incógnita.
- Si hay un dominio propio, recordá que el archivo `CNAME` debe volver a agregarse si fue eliminado.
