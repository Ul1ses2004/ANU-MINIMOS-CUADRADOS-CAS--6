# Herramientas de la presentación

## Archivos activos

- `generar.py`: reúne datos originales, ajuste de los grados 2/4/6/8, validación al retirar observaciones, matrices y creación del HTML autónomo. Cada tarea tiene su propia función. No depende de scripts anteriores.
- `verificar.cjs`: reúne navegación, encabezado fijo, tabla desplegable, gráficos interactivos, matrices adaptables y capturas opcionales. Usa Playwright del entorno instalado y Edge; no modifica la página.
- `capturas/`: imágenes de revisión. No son necesarias para generar la página.
- `respaldo/anteriores/`: todos los scripts y borradores anteriores, conservados sin cambiar su contenido. Son históricos; no ejecutarlos en secuencia sobre la versión actual, porque varios aplican cambios puntuales que ya están hechos.
- `respaldo/manifest.json`: rutas originales, tamaños y SHA-256 para comprobar la conservación.

## Uso

Con Python y Node disponibles en la terminal:

```text
python work/generar.py verificar
python work/generar.py html
python work/generar.py datos
python work/generar.py todo
node work/verificar.cjs
node work/verificar.cjs --capturas
```

`verificar` compara los cálculos y el HTML con la versión guardada, sin escribirlos. `html` empaqueta los archivos actuales; `datos` recalcula los modelos; `todo` realiza ambas tareas. Las rutas se resuelven desde la ubicación del script, no desde la carpeta donde se ejecuta.

Si Python y Node no están en PATH, usar los ejecutables del entorno de Codex bajo `%USERPROFILE%/.cache/codex-runtimes/codex-primary-runtime/dependencies/` (`python/python.exe` y `node/bin/node.exe`). Los cálculos requieren NumPy. El navegador de las verificaciones se puede elegir con `BROWSER_CHANNEL`.

## Qué se edita

El contenido vigente y sus estilos siguen en `outputs/petroleo/dist/app.js` y `style.css`; el documento de entrada es `index.html`. La página para compartir es `outputs/Caso-6-Petroleo.html`. Después de modificar contenido o estilos, ejecutar la acción `html`.

No se reconstruye la página repitiendo parches antiguos. La fuente vigente ya contiene esos cambios. No se fusionaron imágenes ni borradores con scripts ejecutables.

## Conservación y reversión

La reorganización no borra originales ni modifica el contenido de la presentación. Los scripts históricos están en `respaldo/anteriores/` y las imágenes en `capturas/`; el manifiesto permite identificar su ubicación original. Para deshacer la organización se pueden devolver esos archivos a las rutas originales que registra el manifiesto. No es necesario hacerlo para usar la página.
