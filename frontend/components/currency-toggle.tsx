"use client";

import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import type { Currency } from "@/services/api";

const currencies: Currency[] = ["ARS", "USD"];

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="inline-flex rounded-md border border-border bg-muted/60 p-0.5">
      {currencies.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setCurrency(item)}
          className={cn(
            "h-8 rounded-sm px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground",
            currency === item && "bg-card text-foreground shadow-sm",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
