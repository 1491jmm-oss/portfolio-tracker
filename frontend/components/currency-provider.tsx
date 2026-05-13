"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Currency } from "@/services/api";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const storageKey = "portfolio-tracker-currency";
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("ARS");

  useEffect(() => {
    const savedCurrency = window.localStorage.getItem(storageKey);
    if (savedCurrency === "ARS" || savedCurrency === "USD") {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency: (nextCurrency) => {
        window.localStorage.setItem(storageKey, nextCurrency);
        setCurrencyState(nextCurrency);
      },
    }),
    [currency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }

  return context;
}
