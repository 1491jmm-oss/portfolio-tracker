from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models import (
    AssetType,
    BenchmarkType,
    Currency,
    FxForUsd,
    FxRateType,
    MovementType,
    PositionUnit,
    ValuationMethod,
)


def normalize_ticker(value: str) -> str:
    cleaned = value.strip().upper()
    if not cleaned:
        raise ValueError("El ticker no puede estar vacio")
    return cleaned


class AssetBase(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=32)
    nombre: str = Field(..., min_length=1, max_length=255)
    tipo: AssetType
    subtipo: str | None = Field(default=None, max_length=100)
    moneda_cotizacion: Currency
    moneda_origen: Currency
    ratio_cedear: float | None = Field(default=None, gt=0)
    metodo_valuacion: ValuationMethod
    fx_para_usd: FxForUsd
    activo: bool = True

    @field_validator("ticker")
    @classmethod
    def ticker_to_upper(cls, value: str) -> str:
        return normalize_ticker(value)

    @model_validator(mode="after")
    def validate_asset_consistency(self) -> "AssetBase":
        expected_method = {
            AssetType.ACCION: ValuationMethod.EQUITY,
            AssetType.CEDEAR: ValuationMethod.EQUITY,
            AssetType.LIQUIDEZ: ValuationMethod.LIQUIDEZ,
        }.get(self.tipo, ValuationMethod.BONO)

        if self.metodo_valuacion != expected_method:
            raise ValueError(
                f"metodo_valuacion debe ser {expected_method} para activos de tipo {self.tipo}"
            )

        if self.tipo == AssetType.CEDEAR and self.ratio_cedear is None:
            raise ValueError("ratio_cedear es obligatorio para CEDEAR")

        if self.tipo != AssetType.CEDEAR and self.ratio_cedear is not None:
            raise ValueError("ratio_cedear solo aplica a CEDEAR")

        if self.tipo == AssetType.LIQUIDEZ and self.fx_para_usd != FxForUsd.NONE:
            raise ValueError("fx_para_usd debe ser NONE para LIQUIDEZ")

        return self


class AssetCreate(AssetBase):
    pass


class AssetRead(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class MovementBase(BaseModel):
    fecha: date
    ticker: str = Field(..., min_length=1, max_length=32)
    tipo_movimiento: MovementType
    cantidad: float | None = Field(default=None, gt=0)
    nominal: float | None = Field(default=None, gt=0)
    precio: float | None = Field(default=None, ge=0)
    moneda: Currency
    comision: float = Field(default=0, ge=0)
    cash_flow: float | None = None
    observaciones: str | None = None

    @field_validator("ticker")
    @classmethod
    def ticker_to_upper(cls, value: str) -> str:
        return normalize_ticker(value)


class MovementCreate(MovementBase):
    pass


class MovementRead(MovementBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class PositionRead(BaseModel):
    ticker: str
    tipo: AssetType
    cantidad_actual: float | None
    nominal_actual: float | None
    unidad: PositionUnit


class PriceBase(BaseModel):
    fecha: date
    ticker: str = Field(..., min_length=1, max_length=32)
    precio: float = Field(..., gt=0)
    moneda: Currency

    @field_validator("ticker")
    @classmethod
    def ticker_to_upper(cls, value: str) -> str:
        return normalize_ticker(value)


class PriceCreate(PriceBase):
    pass


class PriceRead(PriceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class FxRateBase(BaseModel):
    fecha: date
    tipo: FxRateType
    valor: float = Field(..., gt=0)


class FxRateCreate(FxRateBase):
    pass


class FxRateRead(FxRateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ValuationItem(BaseModel):
    fecha: date
    ticker: str
    tipo: AssetType
    cantidad_actual: float | None
    nominal_actual: float | None
    precio: float | None
    moneda_precio: Currency | None
    valor_ars: float
    valor_usd: float
    fx_usado: FxRateType | None
    ppc: float
    costo_total: float
    costo_total_ars: float
    costo_total_usd: float
    pnl: float
    pnl_ars: float
    pnl_usd: float
    pnl_pct: float | None
    moneda_pnl: Currency
    cashflows_cobrados: float
    total_return: float
    total_return_ars: float
    total_return_usd: float
    total_return_pct: float | None


class ValuationResponse(BaseModel):
    fecha: date
    valuations: list[ValuationItem]
    total_ars: float
    total_usd: float
    total_costo: float
    total_costo_ars: float
    total_costo_usd: float
    total_pnl: float
    total_pnl_ars: float
    total_pnl_usd: float
    total_pnl_pct: float | None
    total_cashflows_cobrados: float
    total_return: float
    total_return_ars: float
    total_return_usd: float
    total_return_pct: float | None


class PortfolioSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: date
    total_ars: float
    total_usd: float
    total_costo_ars: float
    total_costo_usd: float
    total_pnl_ars: float
    total_pnl_usd: float
    total_return_ars: float
    total_return_usd: float
    created_at: datetime


class PortfolioSnapshotItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    snapshot_id: int
    fecha: date
    ticker: str
    tipo: AssetType
    valor_ars: float
    valor_usd: float
    costo_ars: float
    costo_usd: float
    pnl_ars: float
    pnl_usd: float
    total_return_ars: float
    total_return_usd: float
    cantidad_actual: float | None
    nominal_actual: float | None
    peso_portfolio_pct: float
    created_at: datetime


class BenchmarkRead(BaseModel):
    benchmark: BenchmarkType


class BenchmarkPriceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: date
    benchmark: BenchmarkType
    valor: float
    moneda: Currency
    created_at: datetime


class BenchmarkPerformanceRead(BaseModel):
    fecha: date
    valor_original: float
    valor_normalizado: float


class DrawdownPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fecha: date
    valor_portfolio: float
    running_peak: float
    drawdown_pct: float
    drawdown_abs: float


class DrawdownSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    max_drawdown_pct: float
    max_drawdown_abs: float
    fecha_peak: date | None
    fecha_trough: date | None


class DrawdownResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    moneda: Currency
    series: list[DrawdownPointRead]
    summary: DrawdownSummaryRead
