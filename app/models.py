from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


class BenchmarkType(str, Enum):
    CER = "CER"
    SPY = "SPY"


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


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    total_ars: Mapped[float] = mapped_column(Float, nullable=False)
    total_usd: Mapped[float] = mapped_column(Float, nullable=False)
    total_costo_ars: Mapped[float] = mapped_column(Float, nullable=False)
    total_costo_usd: Mapped[float] = mapped_column(Float, nullable=False)
    total_pnl_ars: Mapped[float] = mapped_column(Float, nullable=False)
    total_pnl_usd: Mapped[float] = mapped_column(Float, nullable=False)
    total_return_ars: Mapped[float] = mapped_column(Float, nullable=False)
    total_return_usd: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    items: Mapped[list["PortfolioSnapshotItem"]] = relationship(
        back_populates="snapshot",
        cascade="all, delete-orphan",
    )


class PortfolioSnapshotItem(Base):
    __tablename__ = "portfolio_snapshot_items"
    __table_args__ = (
        UniqueConstraint("snapshot_id", "ticker", name="uq_snapshot_item_snapshot_ticker"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    snapshot_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio_snapshots.id"),
        index=True,
        nullable=False,
    )
    fecha: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    ticker: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(32), nullable=False)
    valor_ars: Mapped[float] = mapped_column(Float, nullable=False)
    valor_usd: Mapped[float] = mapped_column(Float, nullable=False)
    costo_ars: Mapped[float] = mapped_column(Float, nullable=False)
    costo_usd: Mapped[float] = mapped_column(Float, nullable=False)
    pnl_ars: Mapped[float] = mapped_column(Float, nullable=False)
    pnl_usd: Mapped[float] = mapped_column(Float, nullable=False)
    total_return_ars: Mapped[float] = mapped_column(Float, nullable=False)
    total_return_usd: Mapped[float] = mapped_column(Float, nullable=False)
    cantidad_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    nominal_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    peso_portfolio_pct: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    snapshot: Mapped[PortfolioSnapshot] = relationship(back_populates="items")


class BenchmarkPrice(Base):
    __tablename__ = "benchmark_prices"
    __table_args__ = (
        UniqueConstraint("benchmark", "fecha", name="uq_benchmark_price_benchmark_fecha"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    benchmark: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    valor: Mapped[float] = mapped_column(Float, nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
