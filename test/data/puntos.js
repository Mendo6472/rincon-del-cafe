// Datos de prueba de la HU-09 · Programa de puntos.
// Saldos iniciales tomados de data/seed.json de la app.

export const clientes = {
  sinPuntos: { codigo: 'CLI001', saldoInicial: 0 },
  conPuntos: { codigo: 'CLI002', saldoInicial: 500 },
  inexistente: { codigo: 'CLI999' },
};

// Regla: cada $1.000 de compra da 1 punto. Las fracciones no suman punto.
// puntos esperados = parte entera de (monto / 1000)
// etiqueta: '@acceptanceTest' si el caso bloquea el pipeline,
// '@bug' si el caso detecta el bug inyectado (falla mientras el bug exista).
export const casosAcumulacion = [
  { monto: 1000, puntos: 1, nombre: '$1.000 exactos da 1 punto', etiqueta: '@acceptanceTest' },
  { monto: 10000, puntos: 10, nombre: '$10.000 da 10 puntos', etiqueta: '@acceptanceTest' },
  { monto: 2500, puntos: 2, nombre: '$2.500 da 2 puntos (la fracción de $500 no suma)', etiqueta: '@bug' },
  { monto: 1999, puntos: 1, nombre: '$1.999 da 1 punto (la fracción de $999 no suma)', etiqueta: '@bug' },
  { monto: 999, puntos: 0, nombre: '$999 no da puntos (no alcanza a $1.000)', etiqueta: '@bug' },
];

export const mensajes = {
  acumulados: 'Puntos acumulados',
  canjeados: 'Puntos canjeados',
  sinSaldo: 'No tienes suficientes puntos',
  montoInvalido: 'El monto debe ser mayor que 0',
  clienteNoExiste: 'El código de cliente no existe',
};

export const estados = {
  acumulados: 'acumulados',
  canjeados: 'canjeados',
};
