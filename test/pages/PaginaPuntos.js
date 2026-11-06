export class PaginaPuntos {
  constructor(page) {
    this.page = page;
    this.botonMenu = page.getByRole('button', { name: 'Programa de puntos', exact: true });
    this.titulo = page.getByRole('heading', { name: 'Programa de puntos' });

    // Los dos formularios tienen un campo "Código de cliente".
    // Los formularios no tienen nombre accesible, así que se acotan por su id
    // para que getByLabel no encuentre dos campos (strict mode violation).
    const formAcumular = page.locator('#f-acumular');
    this.montoCompra = formAcumular.getByLabel('Monto de compra');
    this.codigoAcumular = formAcumular.getByLabel('Código de cliente');
    this.botonAcumular = formAcumular.getByRole('button', { name: 'Acumular', exact: true });

    const formCanjear = page.locator('#f-canjear');
    this.codigoCanjear = formCanjear.getByLabel('Código de cliente');
    this.puntosACanjear = formCanjear.getByLabel('Puntos a canjear');
    this.botonCanjear = formCanjear.getByRole('button', { name: 'Canjear', exact: true });

    // Resultados (son <strong>/<span>, sin rol): se leen por data-testid.
    this.puntosGanados = page.getByTestId('puntos-ganados');
    this.saldo = page.getByTestId('saldo');
    this.estado = page.getByTestId('estado-puntos');
    this.mensaje = page.getByRole('status');
  }

  async ir() {
    await this.botonMenu.click();
  }

  async acumular(codigoCliente, monto) {
    await this.montoCompra.fill(String(monto));
    await this.codigoAcumular.fill(codigoCliente);
    await this.botonAcumular.click();
  }

  async canjear(codigoCliente, puntos) {
    await this.codigoCanjear.fill(codigoCliente);
    await this.puntosACanjear.fill(String(puntos));
    await this.botonCanjear.click();
  }
}
