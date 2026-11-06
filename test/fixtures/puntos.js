import { test as base, expect } from './login.js';
import { PaginaPuntos } from '../pages/PaginaPuntos.js';

export const test = base.extend({
  // Entrega la pantalla de puntos con los saldos en su estado inicial
  // (CLI001 = 0, CLI002 = 500), para que cada prueba pueda correr sola.
  paginaPuntos: async ({ request, paginaLogueada }, use) => {
    await request.post('/api/reiniciar');

    const puntos = new PaginaPuntos(paginaLogueada);
    await puntos.ir();
    await expect(puntos.titulo).toBeVisible();

    await use(puntos);
  },
});

export { expect };
