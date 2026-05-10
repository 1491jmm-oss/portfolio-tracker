# Portfolio Tracker API

API local simple para seguimiento personal de portafolio de inversiones.

Esta primera etapa incluye:

- Crear activos
- Registrar movimientos
- Consultar posiciones actuales calculadas desde movimientos
- Cargar precios
- Cargar tipos de cambio
- Consultar valuacion de cartera calculada en runtime
- Consultar PPC, costo y P&L por posicion
- Consultar cash flows cobrados y total return por posicion
- Guardar snapshots diarios consolidados para historicos de performance
- Documentacion automatica con Swagger

No incluye frontend, TIR ni benchmark.

## Stack

- Python
- FastAPI
- SQLite
- SQLAlchemy
- Pydantic

## Instalacion

```bash
pip install -r requirements.txt
```

## Ejecutar la API

```bash
uvicorn app.main:app --reload
```

La API queda disponible en:

- `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

## Ejecutar el frontend

El frontend vive en `frontend/` y consume la API local en `http://127.0.0.1:8000`.

```bash
cd frontend
npm install
npm run dev
```

La app web queda disponible en:

- `http://localhost:3000`

Si queres cambiar la URL del backend, crea `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Endpoints

### Assets

- `POST /assets`
- `GET /assets`
- `GET /assets/{ticker}`

### Movements

- `POST /movements`
- `GET /movements`

### Positions

- `GET /positions`

### Prices

- `POST /prices`
- `GET /prices`

### FX Rates

- `POST /fx-rates`
- `GET /fx-rates`

### Valuations

- `GET /valuations?fecha=YYYY-MM-DD`

### Snapshots

- `GET /snapshots`
- `POST /snapshots/create?fecha=YYYY-MM-DD`

## Reglas de posicion

- La posicion no se guarda en base de datos: se calcula desde movimientos.
- Acciones y CEDEAR usan `cantidad`.
- Bonos soberanos, letras, bonos CER, bonos dolar linked, bonos tasa fija y ON usan `nominal`.
- Bonos y ON cotizan cada 100 nominales.
- `COMPRA` aumenta cantidad o nominal.
- `VENTA` reduce cantidad o nominal.
- `AMORTIZACION` reduce nominal.
- `CUPON` y `DIVIDENDO` no modifican posicion.
- `LIQUIDEZ` usa `cash_flow` para calcular saldo.

## Reglas de valuacion

- La valuacion no se guarda en base de datos: se calcula en runtime.
- Se usa el ultimo precio disponible menor o igual a la fecha consultada.
- Se usa el ultimo FX disponible menor o igual a la fecha consultada.
- Si falta un precio necesario, la API devuelve un error claro.
- Si falta un FX necesario, la API devuelve un error claro.
- Acciones y CEDEAR usan `cantidad_actual * precio`.
- CEDEAR no usa `ratio_cedear` para valuar; se usa CCL para pasar a USD.
- Bonos, letras y ON usan `(precio / 100) * nominal_actual`.
- Bonos, letras y ON usan MEP para convertir entre ARS y USD.
- LIQUIDEZ usa el saldo calculado desde `cash_flow` y MEP para convertir.
- PPC, costo y P&L se calculan desde movimientos en runtime.
- Las compras recalculan PPC.
- Las ventas no modifican PPC; reducen posicion y costo proporcionalmente.
- Las comisiones de compra se suman al costo.
- Las comisiones de venta se restan del P&L.
- Dividendos y cupones no modifican PPC.
- Amortizaciones reducen nominal y costo proporcionalmente.
- Los activos con posicion cero se ignoran en valuacion.
- `total_costo`, `total_pnl` y `total_pnl_pct` se informan normalizados en ARS.
- Si un activo tiene compras en monedas mixtas, la API devuelve error claro.
- `CUPON`, `DIVIDENDO` y `AMORTIZACION` suman en `cashflows_cobrados`.
- `CUPON` y `DIVIDENDO` no modifican PPC.
- `AMORTIZACION` reduce nominal, reduce costo proporcionalmente y suma como cash flow cobrado.
- Si un ingreso no trae `cash_flow`, la API intenta calcularlo con `precio` y cantidad/nominal.
- `total_return` es `pnl + cashflows_cobrados`.
- `total_return_pct` es `total_return / costo_total`.
- `/valuations` devuelve metricas dual-currency para cada posicion.
- Acciones y CEDEAR convierten a USD con CCL.
- Bonos, ON, letras y liquidez convierten a USD con MEP.
- Los campos historicos `costo_total`, `pnl` y `total_return` se mantienen temporalmente por compatibilidad.

## Snapshots diarios

- Los snapshots se guardan en la tabla `portfolio_snapshots`.
- Cada snapshot guarda solo totales consolidados de cartera, sin detalle por ticker.
- La API inicia automaticamente un scheduler con APScheduler al arrancar FastAPI.
- El job se ejecuta una vez por dia a las 23:55, timezone `America/Buenos_Aires`.
- Si ya existe un snapshot para una fecha, no se duplica.
- Se puede crear manualmente un snapshot para testing con `POST /snapshots/create?fecha=YYYY-MM-DD`.
- Los logs informan cuando el scheduler inicia, cuando un snapshot se crea y cuando ya existe.

## Ejemplos

Crear un activo:

```bash
curl -X POST http://127.0.0.1:8000/assets \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AL30",
    "nombre": "Bonar 2030",
    "tipo": "BONO_SOBERANO",
    "subtipo": "Soberano USD",
    "moneda_cotizacion": "ARS",
    "moneda_origen": "USD",
    "ratio_cedear": null,
    "metodo_valuacion": "BONO",
    "fx_para_usd": "MEP",
    "activo": true
  }'
```

Registrar una compra:

```bash
curl -X POST http://127.0.0.1:8000/movements \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-05-01",
    "ticker": "AL30",
    "tipo_movimiento": "COMPRA",
    "cantidad": null,
    "nominal": 1000,
    "precio": 55.5,
    "moneda": "ARS",
    "comision": 0,
    "cash_flow": null,
    "observaciones": "Compra inicial"
  }'
```

Consultar posiciones:

```bash
curl http://127.0.0.1:8000/positions
```

Cargar precio:

```bash
curl -X POST http://127.0.0.1:8000/prices \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-05-01",
    "ticker": "AL30",
    "precio": 55.5,
    "moneda": "USD"
  }'
```

Cargar tipo de cambio MEP:

```bash
curl -X POST http://127.0.0.1:8000/fx-rates \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-05-01",
    "tipo": "MEP",
    "valor": 1100
  }'
```

Consultar valuacion:

```bash
curl "http://127.0.0.1:8000/valuations?fecha=2026-05-01"
```

Respuesta esperada:

```json
{
  "fecha": "2026-05-01",
  "valuations": [
    {
      "fecha": "2026-05-01",
      "ticker": "AL30",
      "tipo": "BONO_SOBERANO",
      "cantidad_actual": null,
      "nominal_actual": 1000,
      "precio": 55.5,
      "moneda_precio": "USD",
      "valor_ars": 610500,
      "valor_usd": 555,
      "fx_usado": "MEP",
      "ppc": 55.5,
      "costo_total": 555,
      "costo_total_ars": 610500,
      "costo_total_usd": 555,
      "pnl": 0,
      "pnl_ars": 0,
      "pnl_usd": 0,
      "pnl_pct": 0,
      "moneda_pnl": "USD",
      "cashflows_cobrados": 0,
      "total_return": 0,
      "total_return_ars": 0,
      "total_return_usd": 0,
      "total_return_pct": 0
    }
  ],
  "total_ars": 610500,
  "total_usd": 555,
  "total_costo": 610500,
  "total_costo_ars": 610500,
  "total_costo_usd": 555,
  "total_pnl": 0,
  "total_pnl_ars": 0,
  "total_pnl_usd": 0,
  "total_pnl_pct": 0,
  "total_cashflows_cobrados": 0,
  "total_return": 0,
  "total_return_ars": 0,
  "total_return_usd": 0,
  "total_return_pct": 0
}
```

Registrar un cupon cobrado:

```bash
curl -X POST http://127.0.0.1:8000/movements \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-05-15",
    "ticker": "AL30",
    "tipo_movimiento": "CUPON",
    "cantidad": null,
    "nominal": null,
    "precio": null,
    "moneda": "USD",
    "comision": 0,
    "cash_flow": 25,
    "observaciones": "Cupon cobrado"
  }'
```

Registrar una amortizacion cobrada:

```bash
curl -X POST http://127.0.0.1:8000/movements \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-06-01",
    "ticker": "AL30",
    "tipo_movimiento": "AMORTIZACION",
    "cantidad": null,
    "nominal": 100,
    "precio": null,
    "moneda": "USD",
    "comision": 0,
    "cash_flow": 100,
    "observaciones": "Amortizacion de capital"
  }'
```

Crear snapshot manual:

```bash
curl -X POST "http://127.0.0.1:8000/snapshots/create?fecha=2026-05-01"
```

Consultar snapshots:

```bash
curl http://127.0.0.1:8000/snapshots
```
