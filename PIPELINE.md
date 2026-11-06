# Pipeline de pruebas de aceptación

Archivo: `.github/workflows/pipeline.yml`. Tiene un solo job, `pruebas-aceptacion`.
Levanta la app en el puerto 3000, corre los casos `@acceptanceTest` y queda en verde solo si todos pasan.

## Recorrido en orden

```text
push / PR / botón manual
  → máquina virtual Ubuntu nueva
  → checkout del código
  → Node 22
  → npm ci en app/ y en test/
  → Chromium
  → app encendida en segundo plano (puerto 3000)
  → espera hasta que http://localhost:3000 responda
  → npx playwright test --grep @acceptanceTest
  → sube el reporte (siempre, pase o falle)
```

## Línea por línea

### Cuándo se ejecuta

```yaml
on:
  push:
    branches: [ 'main' ]
  pull_request:
    branches: [ 'main' ]
  workflow_dispatch:
```

- `push` a `main`: cada commit que llega a main se prueba.
- `pull_request` hacia `main`: un cambio se prueba antes de integrarlo.
- `workflow_dispatch`: agrega el botón **Run workflow** en la pestaña Actions para correrlo a mano.

### Permisos

```yaml
permissions:
  contents: read
```

El token que GitHub crea en cada ejecución solo puede leer el código. No necesitamos escribir en Issues
como en el `ci.yml` de Karate, así que no pedimos `issues: write`. Es el principio de mínimo privilegio.

### El job y la máquina

```yaml
jobs:
  pruebas-aceptacion:
    runs-on: ubuntu-latest
```

GitHub crea una máquina Linux vacía para cada ejecución. Todo lo que el job necesita lo tiene que instalar.

### Descargar el código

```yaml
- uses: actions/checkout@v4
```

Equivale a un `git clone` del commit que disparó el pipeline. `uses:` usa una acción que ya publicó GitHub.
`@v4` fija la versión.

### Instalar Node y caché

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
    cache-dependency-path: |
      app/package-lock.json
      test/package-lock.json
```

- Instala Node 22. La app pide Node 18 o más y Playwright también necesita una versión reciente.
- `cache: 'npm'` reemplaza el paso de caché de Gradle del `ci.yml`. Guarda las descargas de npm.
- `cache-dependency-path` le dice qué archivos usar para la clave del caché. Como es mono repo hay dos locks.
  Si cambia alguno, el caché se reconstruye.

### Instalar dependencias

```yaml
- working-directory: app
  run: npm ci
- working-directory: test
  run: npm ci
```

- `working-directory` es la carpeta donde corre el comando.
- `npm ci` instala exactamente lo que dice `package-lock.json`. Por eso los dos locks van en el repositorio.
  `npm install` podría instalar otras versiones y la prueba que pasa en mi computador podría fallar en GitHub.

### Instalar el navegador

```yaml
- working-directory: test
  run: npx playwright install --with-deps chromium
```

Descarga Chromium y las librerías del sistema que necesita en Linux (`--with-deps`). Solo Chromium,
porque es el único proyecto en `playwright.config.js`.

### Levantar la app

```yaml
- working-directory: app
  run: nohup npm start > ../app.log 2>&1 &
```

- `npm start` corre `node server.js`, que escucha en el puerto 3000.
- `&` lo deja corriendo en segundo plano para que el pipeline pueda seguir al siguiente paso.
- `nohup` evita que se apague cuando termina el paso.
- `> ../app.log 2>&1` guarda lo que imprime la app en `app.log`, por si hay que revisar un error.

### Esperar a que responda

```yaml
- run: |
    for intento in $(seq 1 30); do
      if curl -sf http://localhost:3000 > /dev/null; then
        exit 0
      fi
      sleep 2
    done
    cat app.log
    exit 1
```

La app tarda un momento en arrancar. Si las pruebas empiezan antes, fallan con `ECONNREFUSED`.
El ciclo pregunta hasta 30 veces, cada 2 segundos. Si responde, sigue. Si a los 60 segundos no responde,
muestra el log de la app y falla el job.

### Ejecutar las pruebas

```yaml
- working-directory: test
  run: npx playwright test --grep @acceptanceTest
```

- `--grep @acceptanceTest` corre solo los casos que tienen esa etiqueta en el título.
- **No** tiene `continue-on-error`. Si un caso falla, el comando termina con código 1, el paso falla y el job
  queda en rojo. Por eso no necesitamos los pasos 10 y 12 del `ci.yml` (calcular `TEST_RESULT` y `exit 1`):
  en el `ci.yml` existían porque `continue-on-error: true` escondía el fallo.
- Playwright encuentra la app ya encendida en el puerto 3000. Como `webServer` tiene
  `reuseExistingServer: true`, la reutiliza en vez de intentar levantar otra en el mismo puerto.

### Subir el reporte

```yaml
- if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: test/playwright-report/
    retention-days: 30
```

- `if: always()` hace que el paso corra aunque las pruebas hayan fallado. Es justo cuando más se necesita el reporte.
- Aparece en la ejecución, sección **Artifacts**, como `playwright-report`. Se descarga, se descomprime y se abre `index.html`.

## Qué casos bloquean el pipeline

| Etiqueta | Casos | En el pipeline |
|---|---|---|
| `@acceptanceTest` | 11 | Sí. Si alguno falla, el pipeline queda en rojo |
| `@bug` | 5 | No. Detectan el bug de redondeo y fallan mientras el bug exista |

Los casos `@bug` no llevan `@acceptanceTest` porque dejarían el pipeline siempre en rojo por un bug conocido
de la app. Siguen en el proyecto y se corren a mano:

```bash
npx playwright test --grep @bug
```

Ver qué casos corre el pipeline:

```bash
npx playwright test --grep @acceptanceTest --list
```

## Tarea de la diapositiva 23: qué se reutiliza del ci.yml

| Parte del ci.yml | ¿Reutilizable? | Qué cambia o falta |
|---|---|---|
| `on:` (disparadores) | Sí | Se quita el input `testTag`. Siempre corre `@acceptanceTest` |
| `permissions` | Parcial | Solo `contents: read`. No se escribe en Issues |
| Preparar entorno (checkout y setup) | Parcial | `checkout` igual. `setup-java` se cambia por `setup-node` |
| Caché de dependencias | Parcial | En vez de `actions/cache` con Gradle, `cache: 'npm'` de `setup-node` con los dos locks |
| Ejecutar pruebas (paso 8) | Parcial | Gradle y Karate se cambian por `npx playwright test --grep @acceptanceTest`. Se quita `continue-on-error`. Faltan antes: instalar Chromium, levantar la app y esperar el puerto |
| Reportes (`upload-artifact`) | Sí | Cambia la ruta a `test/playwright-report/` |
| Actualizar Issue (curl) | No | El taller no usa Issues como matriz de casos |
| Paso final (`exit 1`) | No | Sin `continue-on-error`, el paso de pruebas ya falla el job solo |

## Cómo se probó que el pipeline bloquea

1. En una rama aparte se cambió a propósito un valor esperado en un caso `@acceptanceTest`.
2. Se abrió un pull request hacia `main`. En Actions el job quedó en **rojo** y el reporte se subió igual.
3. Se cerró ese pull request sin integrarlo. `main` sigue en **verde**.
