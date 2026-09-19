"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { DateFilter } from "@/components/tredro/date-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrenciesQuery } from "@/module/products/hook";
import { cn } from "@/lib/utils";

export interface OverviewFilterParams {
  date_from?: string;
  date_to?: string;
  currency?: string;
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Filter state shared by every overview screen. `params` feeds the overview query and its
 * insights query together, so the cards and the AI sentence always describe the same period and currency.
 * An unset currency means "the company's own" — the server decides.
 */
export function useOverviewFilters() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currency, setCurrency] = useState<string | undefined>();

  const params = useMemo<OverviewFilterParams>(
    () => ({
      date_from: dateRange?.from ? toISODate(dateRange.from) : undefined,
      date_to: dateRange?.to ? toISODate(dateRange.to) : undefined,
      currency,
    }),
    [dateRange, currency],
  );

  return { dateRange, setDateRange, currency, setCurrency, params };
}

interface CurrencyFilterProps {
  /** The currency to highlight — the chosen one, or the one the server answered in. */
  value?: string;
  onChange: (code: string) => void;
  className?: string;
}

/** Segmented control over the active currencies from `GET /api/currencies/`. */
export function CurrencyFilter({ value, onChange, className }: CurrencyFilterProps) {
  const { data, isLoading } = useCurrenciesQuery();
  const currencies = (data?.data?.currencies ?? []).filter((c) => c.is_active);

  if (isLoading) return <Skeleton className="h-8 w-28 rounded-lg" />;
  // Without a list there is nothing to choose — the server keeps answering in the company's currency.
  if (currencies.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="العملة"
      className={cn(
        "inline-flex max-w-full items-center overflow-x-auto rounded-lg border border-border bg-card p-0.5 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {currencies.map(({ id, code, name }) => {
        const active = value === code;
        return (
          <button
            key={id}
            type="button"
            title={name}
            aria-pressed={active}
            onClick={() => onChange(code)}
            className={cn(
              "h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

interface OverviewToolbarProps {
  filters: ReturnType<typeof useOverviewFilters>;
  /** The currency the server actually used (`overview.currency.code`) — highlighted until the user picks one. */
  serverCurrency?: string;
  /** `overview.fx.stale` — the rate provider was unreachable and old rates were used. */
  fxStale?: boolean;
  /** Leading content (a page title) that stays pinned together with the filters. */
  heading?: ReactNode;
  className?: string;
}

/**
 * The overview's header: pinned to the top of the scroll area so the period and currency stay reachable.
 * A screen that sits under its own pinned header sets `--overview-sticky-top` to that header's height.
 * The negative margins bleed the background over the page gutters so scrolled cards never peek through beside it.
 */
export function OverviewToolbar({
  filters,
  serverCurrency,
  fxStale,
  heading,
  className,
}: OverviewToolbarProps) {
  const { dateRange, setDateRange, currency, setCurrency } = filters;
  return (
    <div
      className={cn(
        "sticky top-(--overview-sticky-top,0px) z-10 -mx-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-background/95 px-4 py-2.5 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {heading}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <DateFilter mode="range" value={dateRange} onChange={setDateRange} />
        <CurrencyFilter value={currency ?? serverCurrency} onChange={setCurrency} />
        {fxStale && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <IconRenderer name="warning_outlined" className="size-3.5" />
            أسعار الصرف قد تكون غير محدّثة
          </span>
        )}
      </div>
    </div>
  );
}
