import type { Currency } from "@/services/api";

export function oppositeCurrency(currency: Currency): Currency {
  return currency === "ARS" ? "USD" : "ARS";
}

export function pickCurrencyValue(currency: Currency, arsValue: number, usdValue: number) {
  return currency === "ARS" ? arsValue : usdValue;
}
