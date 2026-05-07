from datetime import date
from enum import Enum

from sqlalchemy import Boolean, Date, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AssetType(str, Enum):
    ACCION = "ACCION"
    CEDEAR = "CEDEAR"
    BONO_SOBERANO = "BONO_SOBERANO"
    LETRA = "LETRA"
    BONO_TASA_FIJA = "BONO_TASA_FIJA"
    BONO_CER = "BONO_CER"
    BONO_DOLAR_LINKED = "BONO_DOLAR_LINKED"
    ON = "ON"
    LIQUIDEZ = "LIQUIDEZ"


class Currency(str, Enum):
    ARS = "ARS"
    USD = "USD"


class ValuationMethod(str, Enum):
    EQUITY = "EQUITY"
    BONO = "BONO"
    LIQUIDEZ = "LIQUIDEZ"


class FxForUsd(str, Enum):
    CCL = "CCL"
    MEP = "MEP"
    NONE = "NONE"


class FxRateType(str, Enum):
    MEP = "MEP"
    CCL = "CCL"
    OFICIAL = "OFICIAL"


class MovementType(str, Enum):
    COMPRA = "COMPRA"
    VENTA = "VENTA"
    CUPON = "CUPON"
    DIVIDENDO = "DIVIDENDO"
    AMORTIZACION = "AMORTIZACION"
    TRANSFERENCIA = "TRANSFERENCIA"
    AJUSTE = "AJUSTE"


class PositionUnit(str, Enum):
    CANTIDAD = "CANTIDAD"
    NOMINAL = "NOMINAL"
    SALDO = "SALDO"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    subtipo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    moneda_cotizacion: Mapped[str] = mapped_column(String(3), nullable=False)
    moneda_origen: Mapped[str] = mapped_column(String(3), nullable=False)
    ratio_cedear: Mapped[float | None] = mapped_column(Float, nullable=True)
    metodo_valuacion: Mapped[str] = mapped_column(String(16), nullable=False)
    fx_para_usd: Mapped[str] = mapped_column(String(8), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Movement(Base):
    __tablename__ = "movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    ticker: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    tipo_movimiento: Mapped[str] = mapped_column(String(20), nullable=False)
    cantidad: Mapped[float | None] = mapped_column(Float, nullable=True)
    nominal: Mapped[float | None] = mapped_column(Float, nullable=True)
    precio: Mapped[float | None] = mapped_column(Float, nullable=True)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    comision: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    cash_flow: Mapped[float | None] = mapped_column(Float, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)


class Price(Base):
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    ticker: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)


class FxRate(Base):
    __tablename__ = "fx_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(8), index=True, nullable=False)
    valor: Mapped[float] = mapped_column(Float, nullable=False)
