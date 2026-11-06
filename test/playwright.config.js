import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Los saldos de puntos viven en memoria y son compartidos por todos.
  // Cada prueba reinicia los datos, así que corren una por una para no pisarse.
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  // Levanta la app si no está corriendo. En el pipeline la app ya la levantó
  // un paso anterior, y reuseExistingServer: true hace que Playwright la reutilice
  // en vez de intentar iniciar otra en el mismo puerto 3000.
  webServer: {
    command: 'npm start',
    cwd: '../app',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    env: { MODO_REFERENCIA: process.env.MODO_REFERENCIA ?? 'false' },
  },
});
