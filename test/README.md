# Pruebas Playwright · HU-09 Programa de puntos

App bajo prueba: El Rincón del Café (`../app`).

## Historia

**Como** cliente, **quiero** acumular puntos por mis compras **para** canjearlos después.

- CA1: Cada $1.000 de compra da 1 punto. Las fracciones no suman punto.
- CA2: Solo puedo canjear hasta mi saldo. Si pido más, la app muestra "No tienes suficientes puntos".
- CA3: Para practicar se usan los códigos `CLI001` (saldo 0) y `CLI002` (saldo 500).

## Bug encontrado

**La app redondea los puntos hacia arriba.** Una fracción de $1.000 da un punto completo.

| Compra | Esperado | La app da |
|---|---|---|
| $999 | 0 | 1 |
| $1.999 | 1 | 2 |
| $2.500 | 2 | 3 |
| $1.000 | 1 | 1 |

Con montos exactos ($1.000, $10.000) el bug no se nota. Solo aparece cuando hay fracción.

Causa en el código (`server.js`, ruta `POST /api/puntos/acumular`): usa `Math.ceil(monto / 1000)`.
Lo correcto es `Math.floor(monto / 1000)`.

Efecto adicional: como el saldo queda inflado, el cliente puede canjear puntos que no ganó
(compra de $2.500 y canje de 3 puntos pasa, cuando debería mostrar "No tienes suficientes puntos").

**Prueba que lo detecta:** `una compra de $2.500 da 2 puntos (la fracción de $500 no suma)`
en `tests/puntos.spec.js`.

## Casos de prueba (16)

Los casos marcados **(detecta el bug)** llevan la etiqueta `@bug` en el título. Los otros 11 llevan
`@acceptanceTest` y son los que corre el pipeline. Ver [../PIPELINE.md](../PIPELINE.md).

CA1 · Acumulación
1. $1.000 exactos da 1 punto
2. $10.000 da 10 puntos
3. $2.500 da 2 puntos **(detecta el bug)**
4. $1.999 da 1 punto **(detecta el bug)**
5. $999 no da puntos **(detecta el bug)**
6. Los puntos ganados se suman al saldo existente (CLI002: 500 + 3 = 503)
7. Varias compras de $1.500 acumulan 1 punto cada una **(detecta el bug)**
8. Monto 0 muestra "El monto debe ser mayor que 0"
9. Código inexistente muestra "El código de cliente no existe"

CA2 · Canje
10. Canjear menos que el saldo descuenta los puntos
11. Canjear exactamente el saldo lo deja en 0
12. Canjear más que el saldo muestra "No tienes suficientes puntos" y no descuenta
13. Un cliente sin puntos no puede canjear
14. No se pueden canjear los puntos de una fracción **(detecta el bug)**
15. Lo acumulado se puede canjear completo
16. Un código inexistente no puede canjear

### Resultados

- Contra la app con bugs: 11 pasan, 5 fallan (los 5 marcados arriba, todos por el redondeo).
- Contra la app en modo referencia (sin bugs): 16 de 16 pasan. Esto confirma que las pruebas
  están bien escritas y que fallan solo por el bug.

## Cómo correr

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test --grep @acceptanceTest   # los 11 que corre el pipeline
npx playwright test --grep @bug              # los 5 que detectan el bug
npm test                                     # los 16
```

La configuración levanta la app sola (`webServer` en `playwright.config.js`).
Si ya tienes la app corriendo en el puerto 3000, la reutiliza.

Modo referencia (sin bugs), en PowerShell:

```powershell
$env:MODO_REFERENCIA='true'; npm test; Remove-Item Env:MODO_REFERENCIA
```

Ver el reporte HTML: `npm run reporte`.

## Estructura (modelo en capas)

```text
tests/puntos.spec.js     Qué se verifica (solo test y expect)
fixtures/puntos.js       Reinicia datos, entra con login y abre "Programa de puntos"
fixtures/login.js        Entrega una página ya logueada
pages/PaginaPuntos.js    Localizadores y acciones de la pantalla de puntos
pages/PaginaLogin.js     Localizadores y acciones del login
data/                    Usuario, clientes, casos y mensajes esperados
```

Decisiones para explicar en la sustentación:

- **Reinicio de datos por prueba.** Los saldos viven en memoria y se comparten. El fixture llama
  `POST /api/reiniciar` antes de cada prueba para que cada una corra sola.
  Por eso `workers: 1`: si corrieran en paralelo, un reinicio borraría el saldo de otra prueba.
- **Formularios acotados por id.** Los dos formularios tienen un campo "Código de cliente".
  Con `getByLabel` a secas hay *strict mode violation*. Los formularios no tienen nombre accesible,
  así que se acotan con `#f-acumular` y `#f-canjear` y dentro se usa `getByLabel`.
- **Resultados por `data-testid`.** Puntos ganados, saldo y estado son `<strong>` y `<span>`, sin rol.
- **Casos con fracción.** El bug solo se ve cuando el monto no es múltiplo de 1.000.
  Por eso los casos de borde son $999, $1.999 y $2.500.
- **Monto negativo no se prueba por la UI.** El campo tiene `min="0"` y el navegador bloquea el
  envío antes de llegar a la app.
