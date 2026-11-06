export class PaginaLogin {
  constructor(page) {
    this.page = page;
    this.correo = page.getByLabel('Correo');
    this.clave = page.getByLabel('Contraseña');
    this.botonIngresar = page.getByRole('button', { name: 'Iniciar sesión' });
  }

  async ir() {
    await this.page.goto('/');
  }

  async iniciarSesion(correo, clave) {
    await this.correo.fill(correo);
    await this.clave.fill(clave);
    await this.botonIngresar.click();
  }
}
