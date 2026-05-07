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
  pnl: number;
  pnl_pct: number | null;
  moneda_pnl: Currency;
  cashflows_cobrados: number;
  total_return: number;
  total_return_pct: number | null;
}

export interface ValuationResponse {
  fecha: string;
  valuations: ValuationItem[];
  total_ars: number;
  total_usd: number;
  total_costo: number;
  total_pnl: number;
  total_pnl_pct: number | null;
  total_cashflows_cobrados: number;
  total_return: number;
  total_return_pct: number | null;
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
