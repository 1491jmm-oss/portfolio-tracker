from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Asset,
    AssetType,
    Currency,
    FxForUsd,
    FxRate,
    FxRateType,
    Movement,
    PositionUnit,
    Price,
)
from app.routes.positions import signed_position_delta, unit_for_asset
from app.schemas import ValuationItem, ValuationResponse
from app.services.cashflows import IncomeCashFlow, collect_income_cashflows
from app.services.cost_basis import CostBasis, calculate_cost_basis


router = APIRouter(prefix="/valuations", tags=["valuations"])


def latest_price(db: Session, ticker: str, valuation_date: date) -> Price | None:
    statement = (
        select(Price)
        .where(Price.ticker == ticker, Price.fecha <= valuation_date)
        .order_by(Price.fecha.desc(), Price.id.desc())
    )
    return db.scalar(statement)


def latest_fx_rate(
    db: Session,
    fx_type: FxRateType,
    valuation_date: date,
    ticker: str,
) -> FxRate:
    statement = (
        select(FxRate)
        .where(FxRate.tipo == fx_type, FxRate.fecha <= valuation_date)
        .order_by(FxRate.fecha.desc(), FxRate.id.desc())
    )
    fx_rate = db.scalar(statement)
    if not fx_rate:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Falta FX {fx_type} menor o igual a {valuation_date} para valuar {ticker}",
        )
    return fx_rate


def current_position_value(
    asset: Asset,
    movements_by_ticker: dict[str, list[Movement]],
) -> tuple[PositionUnit, float]:
    asset_type = AssetType(asset.tipo)
    unit = unit_for_asset(asset_type)
    value = sum(
        signed_position_delta(movement, unit)
        for movement in movements_by_ticker.get(asset.ticker, [])
    )
    return unit, value


def fx_type_for_equity(asset: Asset, asset_type: AssetType) -> FxRateType:
    if asset_type == AssetType.CEDEAR:
        return FxRateType.CCL

    fx_for_usd = FxForUsd(asset.fx_para_usd)
    if fx_for_usd == FxForUsd.CCL:
        return FxRateType.CCL
    if fx_for_usd == FxForUsd.MEP:
        return FxRateType.MEP

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"El activo {asset.ticker} requiere fx_para_usd CCL o MEP para valuar",
    )


def value_with_fx(
    raw_value: float,
    price_currency: Currency,
    fx_rate: FxRate,
) -> tuple[float, float]:
    fx_value = fx_rate.valor
    if price_currency == Currency.USD:
        return raw_value * fx_value, raw_value
    return raw_value, raw_value / fx_value


def convert_currency(
    db: Session,
    asset: Asset,
    amount: float,
    from_currency: Currency,
    to_currency: Currency,
    fx_type: FxRateType,
    valuation_date: date,
) -> float:
    if from_currency == to_currency:
        return amount

    fx_rate = latest_fx_rate(db, fx_type, valuation_date, asset.ticker)
    if from_currency == Currency.USD and to_currency == Currency.ARS:
        return amount * fx_rate.valor
    if from_currency == Currency.ARS and to_currency == Currency.USD:
        return amount / fx_rate.valor

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"No se puede convertir {from_currency} a {to_currency} para {asset.ticker}",
    )


def value_equity(
    db: Session,
    asset: Asset,
    asset_type: AssetType,
    amount: float,
    price: Price,
    valuation_date: date,
) -> tuple[float, float, FxRateType]:
    fx_type = fx_type_for_equity(asset, asset_type)
    fx_rate = latest_fx_rate(db, fx_type, valuation_date, asset.ticker)
    raw_value = amount * price.precio
    value_ars, value_usd = value_with_fx(raw_value, Currency(price.moneda), fx_rate)
    return value_ars, value_usd, fx_type


def value_bond_or_on(
    db: Session,
    asset: Asset,
    nominal: float,
    price: Price,
    valuation_date: date,
) -> tuple[float, float, FxRateType]:
    fx_type = FxRateType.MEP
    fx_rate = latest_fx_rate(db, fx_type, valuation_date, asset.ticker)
    raw_value = (price.precio / 100) * nominal
    value_ars, value_usd = value_with_fx(raw_value, Currency(price.moneda), fx_rate)
    return value_ars, value_usd, fx_type


def value_liquidity(
    db: Session,
    asset: Asset,
    balance: float,
    valuation_date: date,
) -> tuple[float, float, FxRateType]:
    fx_type = FxRateType.MEP
    fx_rate = latest_fx_rate(db, fx_type, valuation_date, asset.ticker)
    fx_value = fx_rate.valor

    if Currency(asset.moneda_origen) == Currency.USD:
        return balance * fx_value, balance, fx_type
    return balance, balance / fx_value, fx_type


def convert_cost_to_ars(
    db: Session,
    asset: Asset,
    cost_basis: CostBasis,
    valuation_date: date,
    preferred_fx_type: FxRateType,
) -> float:
    if cost_basis.moneda_costo is None:
        return cost_basis.costo_total
    if cost_basis.moneda_costo == Currency.ARS:
        return cost_basis.costo_total

    return convert_currency(
        db,
        asset,
        cost_basis.costo_total,
        Currency.USD,
        Currency.ARS,
        preferred_fx_type,
        valuation_date,
    )


def cashflows_for_valuation(
    db: Session,
    asset: Asset,
    cashflows: list[IncomeCashFlow],
    target_currency: Currency,
    valuation_date: date,
    fx_type: FxRateType,
) -> tuple[float, float]:
    item_total = 0.0
    total_ars = 0.0

    for cashflow in cashflows:
        item_total += convert_currency(
            db,
            asset,
            cashflow.amount,
            cashflow.currency,
            target_currency,
            fx_type,
            valuation_date,
        )
        total_ars += convert_currency(
            db,
            asset,
            cashflow.amount,
            cashflow.currency,
            Currency.ARS,
            fx_type,
            valuation_date,
        )

    return item_total, total_ars


def pnl_for_valuation(
    db: Session,
    asset: Asset,
    asset_type: AssetType,
    value_ars: float,
    value_usd: float,
    cost_basis: CostBasis,
    valuation_date: date,
    fx_used: FxRateType,
) -> tuple[float, float | None, Currency, float, float, float]:
    if asset_type == AssetType.LIQUIDEZ:
        total_cost_ars = value_ars
        cost_total = cost_basis.costo_total
        return 0.0, 0.0, Currency(asset.moneda_origen), cost_total, total_cost_ars, 0.0

    if asset_type in {AssetType.ACCION, AssetType.CEDEAR}:
        cost_total = convert_cost_to_ars(db, asset, cost_basis, valuation_date, fx_used)
        pnl = value_ars - cost_total - cost_basis.comisiones_venta
        pnl_currency = Currency.ARS
        total_cost_ars = cost_total
        total_pnl_ars = pnl
    else:
        pnl_currency = cost_basis.moneda_costo or Currency.ARS
        if pnl_currency == Currency.USD:
            cost_total = cost_basis.costo_total
            pnl = value_usd - cost_total - cost_basis.comisiones_venta
            fx_rate = latest_fx_rate(db, FxRateType.MEP, valuation_date, asset.ticker)
            total_cost_ars = cost_total * fx_rate.valor
            total_pnl_ars = pnl * fx_rate.valor
        else:
            cost_total = cost_basis.costo_total
            pnl = value_ars - cost_total - cost_basis.comisiones_venta
            total_cost_ars = cost_total
            total_pnl_ars = pnl

    pnl_pct = None if cost_total == 0 else pnl / cost_total
    return pnl, pnl_pct, pnl_currency, cost_total, total_cost_ars, total_pnl_ars


@router.get("", response_model=ValuationResponse)
def get_valuations(
    fecha: date = Query(..., description="Fecha de valuacion en formato YYYY-MM-DD"),
    db: Session = Depends(get_db),
) -> ValuationResponse:
    assets = list(db.scalars(select(Asset).order_by(Asset.ticker)).all())
    movements_by_ticker: dict[str, list[Movement]] = {}

    movements = db.scalars(select(Movement).where(Movement.fecha <= fecha)).all()
    for movement in movements:
        movements_by_ticker.setdefault(movement.ticker, []).append(movement)

    items: list[ValuationItem] = []
    total_ars = 0.0
    total_usd = 0.0
    total_costo = 0.0
    total_pnl = 0.0
    total_cashflows_cobrados = 0.0
    total_return = 0.0

    for asset in assets:
        asset_type = AssetType(asset.tipo)
        asset_movements = movements_by_ticker.get(asset.ticker, [])
        unit, position_value = current_position_value(asset, movements_by_ticker)
        if position_value == 0:
            continue

        price = None
        if asset_type != AssetType.LIQUIDEZ:
            price = latest_price(db, asset.ticker, fecha)
            if not price:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Falta precio para {asset.ticker} menor o igual a {fecha}",
                )

        if asset_type in {AssetType.ACCION, AssetType.CEDEAR}:
            assert price is not None
            value_ars, value_usd, fx_used = value_equity(
                db, asset, asset_type, position_value, price, fecha
            )
        elif asset_type == AssetType.LIQUIDEZ:
            value_ars, value_usd, fx_used = value_liquidity(
                db, asset, position_value, fecha
            )
        else:
            assert price is not None
            value_ars, value_usd, fx_used = value_bond_or_on(
                db, asset, position_value, price, fecha
            )

        total_ars += value_ars
        total_usd += value_usd
        cost_basis = calculate_cost_basis(asset, asset_movements)
        (
            pnl,
            pnl_pct,
            pnl_currency,
            item_cost_total,
            cost_total_ars,
            pnl_ars_for_total,
        ) = pnl_for_valuation(
            db,
            asset,
            asset_type,
            value_ars,
            value_usd,
            cost_basis,
            fecha,
            fx_used,
        )
        total_costo += cost_total_ars
        total_pnl += pnl_ars_for_total
        cashflows = collect_income_cashflows(asset, asset_movements)
        cashflows_cobrados, cashflows_cobrados_ars = cashflows_for_valuation(
            db,
            asset,
            cashflows,
            pnl_currency,
            fecha,
            fx_used,
        )
        item_total_return = pnl + cashflows_cobrados
        item_total_return_pct = (
            None if item_cost_total == 0 else item_total_return / item_cost_total
        )
        item_ppc = item_cost_total / position_value if position_value != 0 else 0.0
        total_cashflows_cobrados += cashflows_cobrados_ars
        total_return += pnl_ars_for_total + cashflows_cobrados_ars
        items.append(
            ValuationItem(
                fecha=fecha,
                ticker=asset.ticker,
                tipo=asset_type,
                cantidad_actual=position_value if unit == PositionUnit.CANTIDAD else None,
                nominal_actual=position_value if unit == PositionUnit.NOMINAL else None,
                precio=price.precio if price else None,
                moneda_precio=Currency(price.moneda) if price else None,
                valor_ars=value_ars,
                valor_usd=value_usd,
                fx_usado=fx_used,
                ppc=item_ppc,
                costo_total=item_cost_total,
                pnl=pnl,
                pnl_pct=pnl_pct,
                moneda_pnl=pnl_currency,
                cashflows_cobrados=cashflows_cobrados,
                total_return=item_total_return,
                total_return_pct=item_total_return_pct,
            )
        )

    total_pnl_pct = None if total_costo == 0 else total_pnl / total_costo
    total_return_pct = None if total_costo == 0 else total_return / total_costo
    return ValuationResponse(
        fecha=fecha,
        valuations=items,
        total_ars=total_ars,
        total_usd=total_usd,
        total_costo=total_costo,
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl_pct,
        total_cashflows_cobrados=total_cashflows_cobrados,
        total_return=total_return,
        total_return_pct=total_return_pct,
    )
