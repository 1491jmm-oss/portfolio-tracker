"use client";

import { useCurrency } from "@/components/currency-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AssetType, Currency, ValuationItem } from "@/services/api";

interface PortfolioTableProps {
  items: ValuationItem[];
}

function signedClass(value: number) {
  if (value > 0) {
    return "text-positive";
  }

  if (value < 0) {
    return "text-negative";
  }

  return "text-muted-foreground";
}

const fixedIncomeTypes: AssetType[] = [
  "BONO_SOBERANO",
  "LETRA",
  "BONO_TASA_FIJA",
  "BONO_CER",
  "BONO_DOLAR_LINKED",
  "ON",
];

function isFixedIncome(type: AssetType) {
  return fixedIncomeTypes.includes(type);
}

function getPositionBase(item: ValuationItem) {
  if (isFixedIncome(item.tipo)) {
    return item.nominal_actual ?? 0;
  }

  return item.cantidad_actual ?? 0;
}

function formatPrice(item: ValuationItem, currency: Currency) {
  const base = getPositionBase(item);

  if (base <= 0) {
    return "-";
  }

  const value = currency === "ARS" ? item.valor_ars : item.valor_usd;
  const unitPrice = isFixedIncome(item.tipo) ? (value / base) * 100 : value / base;

  return formatMoney(unitPrice, currency);
}

function formatPpc(item: ValuationItem, currency: Currency) {
  const base = getPositionBase(item);

  if (base <= 0) {
    return {
      value: "-",
      detail: isFixedIncome(item.tipo) ? "cada 100 VN" : "por unidad",
    };
  }

  const cost = currency === "ARS" ? item.costo_total_ars : item.costo_total_usd;
  const ppc = isFixedIncome(item.tipo) ? (cost / base) * 100 : cost / base;

  return {
    value: formatMoney(ppc, currency),
    detail: isFixedIncome(item.tipo) ? "cada 100 VN" : "por unidad",
  };
}

function formatPosition(item: ValuationItem) {
  if (item.cantidad_actual !== null) {
    return {
      value: formatNumber(item.cantidad_actual),
      label: "Cantidad",
    };
  }

  if (item.nominal_actual !== null) {
    return {
      value: formatNumber(item.nominal_actual),
      label: "VN",
    };
  }

  return {
    value: "-",
    label: "Saldo",
  };
}

export function PortfolioTable({ items }: PortfolioTableProps) {
  const { currency } = useCurrency();

  return (
    <Card className="overflow-hidden bg-card/85 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Ticker</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad/VN</TableHead>
            <TableHead className="text-right">Precio actual</TableHead>
            <TableHead className="text-right">PPC</TableHead>
            <TableHead className="text-right">Costo {currency}</TableHead>
            <TableHead className="text-right">Valor {currency}</TableHead>
            <TableHead className="text-right">P&L {currency}</TableHead>
            <TableHead className="text-right">TR {currency}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No hay posiciones abiertas para la fecha consultada.
              </TableCell>
            </TableRow>
          ) : null}

          {items.map((item) => {
            const ppc = formatPpc(item, currency);
            const position = formatPosition(item);
            const pnlArs = item.pnl_ars ?? item.pnl;
            const pnlUsd = item.pnl_usd ?? 0;
            const totalReturnArs = item.total_return_ars ?? item.total_return;
            const totalReturnUsd = item.total_return_usd ?? 0;
            const selectedCost = currency === "ARS" ? item.costo_total_ars : item.costo_total_usd;
            const selectedValue = currency === "ARS" ? item.valor_ars : item.valor_usd;
            const selectedPnl = currency === "ARS" ? pnlArs : pnlUsd;
            const selectedReturn = currency === "ARS" ? totalReturnArs : totalReturnUsd;

            return (
              <TableRow key={item.ticker}>
                <TableCell>
                  <div className="font-mono text-sm font-semibold text-foreground">{item.ticker}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.fx_usado ?? "sin FX"}</div>
                </TableCell>
                <TableCell>
                  <Badge>{item.tipo.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-mono text-sm text-foreground">{position.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{position.label}</div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(item, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-mono text-sm text-foreground">{ppc.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{ppc.detail}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatMoney(selectedCost, currency)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(selectedValue, currency)}</TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(selectedPnl))}>
                  <div>{formatMoney(selectedPnl, currency)}</div>
                  <div className="mt-1 text-xs">{formatPercent(item.pnl_pct)}</div>
                </TableCell>
                <TableCell className={cn("text-right font-mono", signedClass(selectedReturn))}>
                  <div>{formatMoney(selectedReturn, currency)}</div>
                  <div className="mt-1 text-xs">{formatPercent(item.total_return_pct)}</div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
