"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AssetType, Currency, MovementCreate } from "@/services/api";

type OperationType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL";

interface TransactionFormProps {
  onSubmit: (movement: MovementCreate) => Promise<void>;
  isSubmitting: boolean;
}

const operationTypes: OperationType[] = ["BUY", "SELL", "DEPOSIT", "WITHDRAWAL"];
const currencies: Currency[] = ["ARS", "USD"];
const assetTypes: AssetType[] = [
  "ACCION",
  "CEDEAR",
  "BONO_SOBERANO",
  "LETRA",
  "BONO_TASA_FIJA",
  "BONO_CER",
  "BONO_DOLAR_LINKED",
  "ON",
];
const fixedIncomeTypes: AssetType[] = [
  "BONO_SOBERANO",
  "LETRA",
  "BONO_TASA_FIJA",
  "BONO_CER",
  "BONO_DOLAR_LINKED",
  "ON",
];

const inputClassName =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15";
const labelClassName = "text-xs font-medium uppercase text-muted-foreground";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isFixedIncome(type: AssetType) {
  return fixedIncomeTypes.includes(type);
}

function cashTicker(currency: Currency) {
  return `CASH_${currency}`;
}

export function TransactionForm({ onSubmit, isSubmitting }: TransactionFormProps) {
  const [operationType, setOperationType] = useState<OperationType>("BUY");
  const [date, setDate] = useState(today());
  const [ticker, setTicker] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("ACCION");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [fees, setFees] = useState("");
  const [broker, setBroker] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isTrade = operationType === "BUY" || operationType === "SELL";
  const unitLabel = useMemo(() => (isFixedIncome(assetType) ? "Nominal" : "Quantity"), [assetType]);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      if (isTrade) {
        const numericQuantity = Number(quantity);
        const numericPrice = Number(price);
        const numericFees = fees ? Number(fees) : 0;

        if (!date || !ticker.trim() || numericQuantity <= 0 || numericPrice < 0 || numericFees < 0) {
          throw new Error("Completá fecha, ticker, cantidad/precio válidos y comisión no negativa.");
        }

        const movement: MovementCreate = {
          fecha: date,
          ticker: ticker.trim().toUpperCase(),
          tipo_movimiento: operationType === "BUY" ? "COMPRA" : "VENTA",
          moneda: currency,
          precio: numericPrice,
          comision: numericFees,
          observaciones: broker.trim() ? `Broker: ${broker.trim()}` : null,
          cantidad: isFixedIncome(assetType) ? null : numericQuantity,
          nominal: isFixedIncome(assetType) ? numericQuantity : null,
        };

        await onSubmit(movement);
        setTicker("");
        setQuantity("");
        setPrice("");
        setFees("");
        setBroker("");
        return;
      }

      const numericAmount = Number(amount);

      if (!date || numericAmount <= 0) {
        throw new Error("Completá fecha y monto mayor a cero.");
      }

      await onSubmit({
        fecha: date,
        ticker: cashTicker(currency),
        tipo_movimiento: "TRANSFERENCIA",
        moneda: currency,
        comision: 0,
        cash_flow: operationType === "DEPOSIT" ? numericAmount : -numericAmount,
        observaciones: description.trim() || operationType,
      });
      setAmount("");
      setDescription("");
    } catch (currentError) {
      setFormError(currentError instanceof Error ? currentError.message : "Error desconocido");
    }
  }

  return (
    <Card className="bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle>Transaction Form</CardTitle>
        <p className="text-sm text-muted-foreground">
          Carga manual mínima para alimentar movimientos y posiciones derivadas.
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submitForm}>
          <div className="flex flex-wrap gap-2">
            {operationTypes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOperationType(item)}
                className={cn(
                  "h-8 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition",
                  operationType === item && "border-primary/40 bg-primary/10 text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-1.5">
              <span className={labelClassName}>Fecha</span>
              <input className={inputClassName} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className={labelClassName}>Currency</span>
              <select className={inputClassName} value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
                {currencies.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            {isTrade ? (
              <>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>Ticker</span>
                  <input className={inputClassName} value={ticker} onChange={(event) => setTicker(event.target.value)} placeholder="AL30" />
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>Asset type</span>
                  <select className={inputClassName} value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>
                    {assetTypes.map((item) => (
                      <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>{unitLabel}</span>
                  <input className={inputClassName} type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>Price</span>
                  <input className={inputClassName} type="number" min="0" step="any" value={price} onChange={(event) => setPrice(event.target.value)} />
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>Fees</span>
                  <input className={inputClassName} type="number" min="0" step="any" value={fees} onChange={(event) => setFees(event.target.value)} placeholder="0" />
                </label>
                <label className="grid gap-1.5 md:col-span-2">
                  <span className={labelClassName}>Broker</span>
                  <input className={inputClassName} value={broker} onChange={(event) => setBroker(event.target.value)} placeholder="Optional" />
                </label>
              </>
            ) : (
              <>
                <label className="grid gap-1.5">
                  <span className={labelClassName}>Amount</span>
                  <input className={inputClassName} type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </label>
                <label className="grid gap-1.5 md:col-span-2">
                  <span className={labelClassName}>Description</span>
                  <input className={inputClassName} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" />
                </label>
              </>
            )}
          </div>

          {formError ? <p className="text-sm text-negative">{formError}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
