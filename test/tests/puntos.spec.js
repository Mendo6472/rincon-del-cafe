import { test, expect } from '../fixtures/puntos.js';
import { clientes, casosAcumulacion, mensajes, estados } from '../data/puntos.js';

const { sinPuntos, conPuntos, inexistente } = clientes;

test.describe('HU-09 · Programa de puntos', () => {
  test.describe('CA1 · Cada $1.000 de compra da 1 punto y las fracciones no suman', () => {
    for (const caso of casosAcumulacion) {
      test(`una compra de ${caso.nombre} ${caso.etiqueta}`, async ({ paginaPuntos }) => {
        await paginaPuntos.acumular(sinPuntos.codigo, caso.monto);

        await expect(paginaPuntos.mensaje).toHaveText(mensajes.acumulados);
        await expect(paginaPuntos.puntosGanados).toHaveText(String(caso.puntos));
        await expect(paginaPuntos.saldo).toHaveText(String(sinPuntos.saldoInicial + caso.puntos));
        await expect(paginaPuntos.estado).toHaveText(estados.acumulados);
      });
    }

    test('los puntos ganados se suman al saldo que ya tenía el cliente @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.acumular(conPuntos.codigo, 3000);

      await expect(paginaPuntos.puntosGanados).toHaveText('3');
      await expect(paginaPuntos.saldo).toHaveText(String(conPuntos.saldoInicial + 3));
    });

    test('varias compras acumulan sin redondear cada una hacia arriba @bug', async ({ paginaPuntos }) => {
      // 1.500 + 1.500 = 2 compras de 1 punto cada una → saldo 2
      await paginaPuntos.acumular(sinPuntos.codigo, 1500);
      await expect(paginaPuntos.puntosGanados).toHaveText('1');
      await paginaPuntos.acumular(sinPuntos.codigo, 1500);

      await expect(paginaPuntos.puntosGanados).toHaveText('1');
      await expect(paginaPuntos.saldo).toHaveText('2');
    });

    test('un monto de 0 muestra un error y no acumula @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.acumular(sinPuntos.codigo, 0);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.montoInvalido);
      await expect(paginaPuntos.saldo).toHaveText('-');
    });

    test('un código de cliente que no existe muestra un error @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.acumular(inexistente.codigo, 5000);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.clienteNoExiste);
      await expect(paginaPuntos.saldo).toHaveText('-');
    });
  });

  test.describe('CA2 · Solo se puede canjear hasta el saldo', () => {
    test('canjear menos que el saldo descuenta los puntos @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.canjear(conPuntos.codigo, 200);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.canjeados);
      await expect(paginaPuntos.saldo).toHaveText(String(conPuntos.saldoInicial - 100));
      await expect(paginaPuntos.estado).toHaveText(estados.canjeados);
    });

    test('canjear exactamente el saldo deja el saldo en 0 @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.canjear(conPuntos.codigo, conPuntos.saldoInicial);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.canjeados);
      await expect(paginaPuntos.saldo).toHaveText('0');
    });

    test('canjear más que el saldo muestra "No tienes suficientes puntos" y no descuenta @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.canjear(conPuntos.codigo, conPuntos.saldoInicial + 1);
      await expect(paginaPuntos.mensaje).toHaveText(mensajes.sinSaldo);

      // Si no descontó nada, todavía se puede canjear el saldo completo.
      await paginaPuntos.canjear(conPuntos.codigo, conPuntos.saldoInicial);
      await expect(paginaPuntos.mensaje).toHaveText(mensajes.canjeados);
      await expect(paginaPuntos.saldo).toHaveText('0');
    });

    test('un cliente sin puntos no puede canjear @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.canjear(sinPuntos.codigo, 1);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.sinSaldo);
    });

    test('no se pueden canjear los puntos de una fracción que no sumó @bug', async ({ paginaPuntos }) => {
      // $2.500 debe dar 2 puntos. Pedir 3 debe fallar.
      await paginaPuntos.acumular(sinPuntos.codigo, 2500);
      await paginaPuntos.canjear(sinPuntos.codigo, 3);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.sinSaldo);
    });

    test('lo acumulado se puede canjear completo @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.acumular(sinPuntos.codigo, 5000);
      await expect(paginaPuntos.saldo).toHaveText('5');

      await paginaPuntos.canjear(sinPuntos.codigo, 5);
      await expect(paginaPuntos.mensaje).toHaveText(mensajes.canjeados);
      await expect(paginaPuntos.saldo).toHaveText('0');
    });

    test('un código de cliente que no existe no puede canjear @acceptanceTest', async ({ paginaPuntos }) => {
      await paginaPuntos.canjear(inexistente.codigo, 1);

      await expect(paginaPuntos.mensaje).toHaveText(mensajes.clienteNoExiste);
    });
  });
});
