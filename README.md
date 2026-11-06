# El Rincón del Café · mono repo

Taller de Playwright. Historia de usuario: **HU-09 · Programa de puntos**.

```text
rincon-del-cafe/
├── app/                      La aplicación (Node.js + Express)
├── test/                     Pruebas de aceptación con Playwright
└── .github/workflows/
    └── pipeline.yml          Pipeline de pruebas de aceptación
```

La app y sus pruebas viven en el mismo repositorio. Así el pipeline prueba el mismo commit.

- Pruebas, bug encontrado y casos: [test/README.md](test/README.md)
- Explicación del pipeline línea por línea: [PIPELINE.md](PIPELINE.md)

## Correr en local

```bash
cd app
npm ci
cd ../test
npm ci
npx playwright install --with-deps chromium
npx playwright test --grep @acceptanceTest
```

`webServer` en `test/playwright.config.js` enciende la app si no está corriendo.
