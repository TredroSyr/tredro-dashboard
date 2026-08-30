"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatMoney, num } from "../lib/format";
import { AmountBadge } from "./amount-badge";

interface LedgerBarProps {
  totalAmount: string;
  paidAmount: string;
  returnedAmount: string;
  balanceDue: string;
  overageAmount?: string;
  /** the document's own pinned currency (frontend2.md Part A) */
  currency?: string;
  size?: "sm" | "lg";
  isOverdue?: boolean;
  className?: string;
}

/**
 * Visualizes balance_due = max(0, total - paid - returned) as a single bar
 * instead of three numbers the reader has to subtract in their head:
 * filled = paid, hatched = returned, hollow = still owed.
 */
export function LedgerBar({
  totalAmount,
  paidAmount,
  returnedAmount,
  balanceDue,
  overageAmount,
  currency,
  size = "sm",
  isOverdue = false,
  className,
}: LedgerBarProps) {
  const total = num(totalAmount);
  const paid = num(paidAmount);
  const returned = num(returnedAmount);
  const balance = num(balanceDue);
  const overage = num(overageAmount);

  const paidPct = total > 0 ? Math.min(paid, total) / total : balance === 0 ? 1 : 0;
  const remainingAfterPaid = total > 0 ? Math.max(total - Math.min(paid, total), 0) : 0;
  const returnedPct = total > 0 ? Math.min(returned, remainingAfterPaid) / total : 0;
  const balancePct = Math.max(0, 1 - paidPct - returnedPct);

  const label = `مدفوع ${formatMoney(paidAmount, currency)} من ${formatMoney(
    totalAmount,
    currency,
  )}${returned > 0 ? `، مرتجع ${formatMoney(returnedAmount, currency)}` : ""}، المتبقي ${formatMoney(
    balanceDue,
    currency,
  )}`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="img"
        aria-label={label}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-3",
        )}
      >
        <div className="absolute inset-y-0 right-0 flex h-full w-full flex-row-reverse">
          <div
            className="h-full shrink-0 bg-primary motion-safe:transition-all motion-safe:duration-500"
            style={{ width: `${paidPct * 100}%` }}
          />
          <div
            className="h-full shrink-0 opacity-70 motion-safe:transition-all motion-safe:duration-500"
            style={{
              width: `${returnedPct * 100}%`,
              backgroundImage:
                "repeating-linear-gradient(-45deg, var(--muted-foreground) 0 3px, transparent 3px 6px)",
            }}
          />
          <div
            className={cn(
              "h-full shrink-0 motion-safe:transition-all motion-safe:duration-500",
              isOverdue ? "bg-destructive/25" : "bg-transparent",
            )}
            style={{ width: `${balancePct * 100}%` }}
          />
        </div>
      </div>

      {size === "lg" && (
        <div
          className="flex items-center gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs text-muted-foreground sm:flex-wrap sm:overflow-visible"
          dir="rtl"
        >
          <LegendDot
            colorClass="bg-primary"
            label="مدفوع"
            value={<AmountBadge amount={paidAmount} currency={currency} />}
          />
          {returned > 0 && (
            <LegendDot
              hatched
              label="مرتجع"
              value={<AmountBadge amount={returnedAmount} currency={currency} />}
            />
          )}
          <LegendDot
            colorClass={isOverdue ? "bg-destructive/50" : "bg-muted"}
            label="المتبقي"
            value={<AmountBadge amount={balanceDue} currency={currency} />}
          />
          {overage > 0 && (
            <span className="flex shrink-0 snap-start items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 font-medium text-warning">
              زيادة مستحقة للزبون:
              <AmountBadge amount={overageAmount} currency={currency} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function LegendDot({
  colorClass,
  hatched,
  label,
  value,
}: {
  colorClass?: string;
  hatched?: boolean;
  label: string;
  value: ReactNode;
}) {
  return (
    <span className="flex shrink-0 snap-start items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2">
      <span
        className={cn("size-2 shrink-0 rounded-full", colorClass)}
        style={
          hatched
            ? {
                backgroundImage:
                  "repeating-linear-gradient(-45deg, var(--muted-foreground) 0 1.5px, transparent 1.5px 3px)",
              }
            : undefined
        }
      />
      {label}: {value}
    </span>
  );
}
