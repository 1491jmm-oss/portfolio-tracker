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

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${datePart} · ${timePart}`;
}
