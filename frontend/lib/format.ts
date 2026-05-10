export function formatMoney(value: number, currency: "ARS" | "USD" = "ARS") {
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: currency === "ARS" ? 0 : 2,
    maximumFractionDigits: currency === "ARS" ? 0 : 2,
  }).format(value);

  return currency === "USD" ? `U$S ${formatted}` : `$ ${formatted}`;
}

export function formatCompactMoney(value: number, currency: "ARS" | "USD" = "ARS") {
  const formatted = new Intl.NumberFormat("es-AR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return currency === "USD" ? `U$S ${formatted}` : `$ ${formatted}`;
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
