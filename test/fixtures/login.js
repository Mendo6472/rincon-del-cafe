import { test as base, expect } from '@playwright/test';
import { PaginaLogin } from '../pages/PaginaLogin.js';
import { usuarioDePrueba } from '../data/usuarios.js';

export const test = base.extend({
  paginaLogueada: async ({ page }, use) => {
    const login = new PaginaLogin(page);
    await login.ir();
    await login.iniciarSesion(usuarioDePrueba.correo, usuarioDePrueba.clave);
    await expect(page.getByRole('button', { name: 'Carrito', exact: true })).toBeVisible();

    await use(page);
  },
});

export { expect };
