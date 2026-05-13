export type AssetType =
  | "ACCION"
  | "CEDEAR"
  | "BONO_SOBERANO"
  | "LETRA"
  | "BONO_TASA_FIJA"
  | "BONO_CER"
  | "BONO_DOLAR_LINKED"
  | "ON"
  | "LIQUIDEZ";

export type Currency = "ARS" | "USD";
export type Benchmark = "CER" | "SPY";

export interface ValuationItem {
  fecha: string;
  ticker: string;
  tipo: AssetType;
  cantidad_actual: number | null;
  nominal_actual: number | null;
  precio: number | null;
  moneda_precio: Currency | null;
  valor_ars: number;
  valor_usd: number;
  fx_usado: "MEP" | "CCL" | "OFICIAL" | null;
  ppc: number;
  costo_total: number;
  costo_total_ars: number;
  costo_total_usd: number;
  pnl: number;
  pnl_ars: number;
  pnl_usd: number;
  pnl_pct: number | null;
  moneda_pnl: Currency;
  cashflows_cobrados: number;
  total_return: number;
  total_return_ars: number;
  total_return_usd: number;
  total_return_pct: number | null;
}

export interface ValuationResponse {
  fecha: string;
  valuations: ValuationItem[];
  total_ars: number;
  total_usd: number;
  total_costo: number;
  total_costo_ars: number;
  total_costo_usd: number;
  total_pnl: number;
  total_pnl_ars: number;
  total_pnl_usd: number;
  total_pnl_pct: number | null;
  total_cashflows_cobrados: number;
  total_return: number;
  total_return_ars: number;
  total_return_usd: number;
  total_return_pct: number | null;
}

export interface Snapshot {
  id: number;
  fecha: string;
  total_ars: number;
  total_usd: number;
  total_costo_ars: number;
  total_costo_usd: number;
  total_pnl_ars: number;
  total_pnl_usd: number;
  total_return_ars: number;
  total_return_usd: number;
  created_at: string;
}

export interface SnapshotItem {
  id: number;
  snapshot_id: number;
  fecha: string;
  ticker: string;
  tipo: AssetType;
  valor_ars: number;
  valor_usd: number;
  costo_ars: number;
  costo_usd: number;
  pnl_ars: number;
  pnl_usd: number;
  total_return_ars: number;
  total_return_usd: number;
  cantidad_actual: number | null;
  nominal_actual: number | null;
  peso_portfolio_pct: number;
  created_at: string;
}

export interface BenchmarkPerformancePoint {
  fecha: string;
  valor_original: number;
  valor_normalizado: number;
}

export interface DrawdownPoint {
  fecha: string;
  valor_portfolio: number;
  running_peak: number;
  drawdown_pct: number;
  drawdown_abs: number;
}

export interface DrawdownSummary {
  max_drawdown_pct: number;
  max_drawdown_abs: number;
  fecha_peak: string | null;
  fecha_trough: string | null;
}

export interface DrawdownResponse {
  moneda: Currency;
  series: DrawdownPoint[];
  summary: DrawdownSummary;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message =
      typeof detail?.detail === "string"
        ? detail.detail
        : `Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getValuations(date: string) {
  return request<ValuationResponse>(`/valuations?fecha=${date}`);
}

export function getSnapshots() {
  return request<Snapshot[]>("/snapshots");
}

export function getSnapshotItems() {
  return request<SnapshotItem[]>("/snapshots/items");
}

export function getBenchmarkPerformance(benchmark: Benchmark) {
  return request<BenchmarkPerformancePoint[]>(`/benchmarks/performance?benchmark=${benchmark}`);
}

export function getDrawdowns(currency: Currency) {
  return request<DrawdownResponse>(`/analytics/drawdowns?moneda=${currency}`);
}
