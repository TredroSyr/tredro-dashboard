"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { DateFilter } from "@/components/tredro/date-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrenciesQuery, useFxRatesQuery } from "@/module/products/hook";
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

/** The only currencies whose rate is shown in the hint. */
const HINT_CODES = ["USD", "TRY", "SYP"];

const formatAmount = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : n >= 1 ? 2 : 4 });

/**
 * `rate` is `1 base = rate × code`. Rows read as "1 stronger = N weaker" so N is always ≥ 1:
 * a rate above 1 means the base is the stronger one, below 1 the other currency is.
 */
function describeRate(base: string, code: string, rate: number) {
  return rate >= 1
    ? { unit: base, per: formatAmount(rate), quote: code }
    : { unit: code, per: formatAmount(1 / rate), quote: base };
}

function FxRow({ unit, per, quote, index }: { unit: string; per: string; quote: string; index: number }) {
  return (
    <div
      dir="ltr"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
      className="flex items-center justify-between gap-6 rounded-lg bg-muted/60 px-3 py-2 duration-300 animate-in fade-in-0 slide-in-from-bottom-1"
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        1
        <span className="rounded-md bg-background px-1.5 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border">
          {unit}
        </span>
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {per} <span className="text-xs font-medium text-muted-foreground">{quote}</span>
      </span>
    </div>
  );
}

/** Tells the user the figures are converted, and shows the USD / TRY / SYP rates used (`GET /api/fx/latest/{base}`). Opens on click. */
function FxRatesHint({ base }: { base?: string }) {
  const { data, isLoading, isError } = useFxRatesQuery(base);
  const rates = data?.rates;
  const rows = base
    ? HINT_CODES.filter((code) => code !== base && Number(rates?.[code]) > 0).map((code) =>
        describeRate(base, code, Number(rates![code])),
      )
    : [];

  return (
    <Popover>
      <PopoverTrigger
        aria-label="أسعار الصرف المستخدمة"
        className="group flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-90 data-popup-open:bg-primary/10 data-popup-open:text-primary"
      >
        <IconRenderer
          name="info_outlined"
          className="size-4 transition-transform duration-200 group-data-popup-open:rotate-12 group-data-popup-open:scale-110"
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-72 gap-3 p-3.5 duration-200"
      >
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconRenderer name="info_outlined" className="size-4" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">أسعار الصرف</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              يتم تحويل المبالغ إلى العملة المختارة بأحدث أسعار الصرف.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <>
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
            </>
          ) : isError ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive animate-in fade-in-0">
              <IconRenderer name="warning_outlined" className="size-3.5" />
              تعذّر تحميل أسعار الصرف
            </span>
          ) : (
            rows.map((row, i) => <FxRow key={`${base}-${row.unit}-${row.quote}`} index={i} {...row} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Segmented control over the active currencies from `GET /api/currencies/`, with a hint about the rates used. */
export function CurrencyFilter({ value, onChange, className }: CurrencyFilterProps) {
  const { data, isLoading } = useCurrenciesQuery();
  const currencies = (data?.data?.currencies ?? []).filter((c) => c.is_active);

  if (isLoading) return <Skeleton className="h-8 w-28 rounded-lg" />;
  // Without a list there is nothing to choose — the server keeps answering in the company's currency.
  if (currencies.length === 0) return null;

  return (
    <div className="inline-flex max-w-full items-center gap-1">
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
      <FxRatesHint base={value} />
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
