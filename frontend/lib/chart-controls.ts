import type { Currency } from "@/services/api";

export type TimeRange = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
export type ScaleMode = "linear" | "log";
export type ChartMode = "absolute" | "relative";

export const timeRanges: TimeRange[] = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];
export const currencies: Currency[] = ["ARS", "USD"];
export const chartModes: ChartMode[] = ["absolute", "relative"];
export const scaleModes: ScaleMode[] = ["linear", "log"];

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function subtractMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() - months);
  return next;
}

function startDateForRange(range: TimeRange, latestDate: Date) {
  if (range === "ALL") {
    return null;
  }

  if (range === "YTD") {
    return new Date(latestDate.getFullYear(), 0, 1);
  }

  if (range === "1Y") {
    return subtractMonths(latestDate, 12);
  }

  const months = Number(range.replace("M", ""));
  return subtractMonths(latestDate, months);
}

export function filterByRange<T extends { fecha: string }>(items: T[], range: TimeRange) {
  const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const latest = sorted.at(-1);
  if (!latest) {
    return [];
  }

  const startDate = startDateForRange(range, parseDate(latest.fecha));
  if (!startDate) {
    return sorted;
  }

  return sorted.filter((item) => parseDate(item.fecha) >= startDate);
}
