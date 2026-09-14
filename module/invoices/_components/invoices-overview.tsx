"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { DateFilter } from "@/components/tredro/date-filter";
import {
  OverviewActivityGroup,
  OverviewActivitySection,
  OverviewActivityTile,
  OverviewActivityTileSkeleton,
  OverviewDistributionChart,
  OverviewDistributionChartSkeleton,
  OverviewStatCard,
  OverviewStatCardRow,
  OverviewStatCardSkeleton,
  type OverviewDistributionBar,
} from "@/components/tredro/overview-widgets";
import { useInvoicesOverviewQuery } from "../hooks";
import { formatDateShort, formatMoneyParts } from "../lib/format";
import type { InvoicesOverview, SalesInvoiceStatus } from "../types";

const STATUS_LABELS: Record<SalesInvoiceStatus, string> = {
  fully_paid: "مدفوعة بالكامل",
  partially_paid: "مدفوعة جزئياً",
  deferred: "آجلة",
};

// ---- AI cards — no backend endpoint yet (dashboard_overview.md §8), kept as illustrative copy ----

const FORECAST_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "تحصيل قوي هالشهر",
    description:
      "نسبة التحصيل من إجمالي المبيعات وصلت 72%، أعلى من متوسط الأشهر الماضية.",
  },
  {
    indicator: "warning",
    label: "ديون متأخرة تحتاج متابعة",
    description:
      "14 فاتورة تجاوزت عتبة التأخر بقيمة إجمالية 940,000 ل.س — يُنصح بمتابعة المناديب المعنيين.",
  },
  {
    indicator: "info",
    label: "نمو في المبيعات",
    description:
      "إجمالي المبيعات ارتفع 6% مقارنة بالشهر الماضي، مع استقرار نسبة المرتجعات.",
  },
];

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات الفواتير والتحصيل خلال الفترة الحالية، وبافتراض استمرار نفس المعدلات لنهاية الشهر:";

const PERFORMANCE_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: "up" | "down" | "steady";
}[] = [
  {
    metric: "المبيعات",
    current: "الوضع الحالي: 8,450,000 ل.س منذ بداية الشهر",
    projected: "التوقع: ≈ 9,700,000 ل.س نهاية الشهر (+15%)",
    trend: "up",
  },
  {
    metric: "التحصيل",
    current: "الوضع الحالي: 6,120,000 ل.س محصّلة",
    projected: "التوقع: استمرار معدل التحصيل عند 72% من المبيعات",
    trend: "up",
  },
  {
    metric: "الديون المتأخرة",
    current: "الوضع الحالي: 940,000 ل.س على 14 فاتورة",
    projected: "التوقع: خطر ارتفاع الرصيد المتأخر دون متابعة",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 2.1% من إجمالي الفواتير",
    projected: "التوقع: بتضل ثابتة ضمن المعدل الطبيعي (1-3%)",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "متابعة المناديب المسؤولين عن الفواتير المتأخرة قبل نهاية الأسبوع.",
  "تذكير الزبائن أصحاب الفواتير الآجلة القريبة من عتبة التأخر.",
  "مراجعة الأرصدة الدائنة المعلّقة وتطبيقها على فواتير الزبائن القادمة.",
];

const TREND_ICON: Record<string, iconName> = {
  up: "arrow_up_outlined",
  down: "arrow_down_outlined",
  steady: "minus_outlined",
};

const TREND_CLASS: Record<string, string> = {
  up: "text-emerald-600 bg-emerald-500/10",
  down: "text-red-500 bg-red-500/10",
  steady: "text-muted-foreground bg-muted",
};

const INDICATOR_ICON: Record<string, iconName> = {
  error: "warning_outlined",
  warning: "warning_outlined",
  success: "success_outlined",
  info: "info_outlined",
};

const INDICATOR_ICON_CLASS: Record<string, string> = {
  error: "text-red-200",
  warning: "text-amber-200",
  success: "text-emerald-200",
  info: "text-white/80",
};

function InsightBanner() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (FORECAST_BANNER.length < 2) return;
    const id = setInterval(
      () => setActive((p) => (p + 1) % FORECAST_BANNER.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  const current = FORECAST_BANNER[active];

  return (
    <div className="rounded-2xl bg-primary p-5 sm:p-6 text-primary-foreground relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-medium">توقعات وتنبؤات</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1">
          <IconRenderer name="ai_outlined" className="size-3" />
          AI
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <IconRenderer
            name={INDICATOR_ICON[current.indicator]}
            className={`size-4 mt-0.5 shrink-0 ${INDICATOR_ICON_CLASS[current.indicator]}`}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{current.label}</span>
            <p className="text-xs leading-relaxed text-white/80">
              {current.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {FORECAST_BANNER.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`توقع ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function InvoiceInsights() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name="ai_outlined" className="size-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-foreground">
          تحليل الفواتير والتحصيل
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {ANALYSIS_INTRO}
      </p>

      <ul className="space-y-3">
        {PERFORMANCE_PROJECTIONS.map((p, idx) => (
          <li key={idx} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TREND_CLASS[p.trend]}`}
            >
              <IconRenderer name={TREND_ICON[p.trend]} className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm mb-1 text-foreground">
                {p.metric}
              </div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                {p.current}
              </div>
              <div className="text-foreground text-xs leading-relaxed mt-0.5">
                {p.projected}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          شو لازم يعمل المسؤول عن الفواتير بناءً عالتوقعات
        </h3>
        <ul className="list-disc ps-5 space-y-2">
          {PERFORMANCE_RECOMMENDATIONS.map((rec, idx) => (
            <li key={idx} className="text-muted-foreground text-sm leading-relaxed">
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- Real data: KPI row, status distribution and activity section ----

interface Kpi {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change: number | null;
  icon: iconName;
}

function buildKpis(overview: InvoicesOverview): Kpi[] {
  const { sales, collections, debts, returns, currency } = overview;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);
  const collected = formatMoneyParts(collections.total_amount.value, currency.code);
  const overdue = formatMoneyParts(debts.overdue.balance_due, currency.code);
  const avgInvoice = formatMoneyParts(sales.average_amount.value, currency.code);

  return [
    {
      key: "invoiceCount",
      label: "فواتير البيع هالفترة",
      value: sales.invoice_count.value,
      change: sales.invoice_count.change_pct,
      icon: "sales_outlined",
    },
    {
      key: "totalSales",
      label: "إجمالي المبيعات",
      value: totalAmount.amount,
      suffix: totalAmount.label,
      change: sales.total_amount.change_pct,
      icon: "revenue_outlined",
    },
    {
      key: "collected",
      label: "المحصّل هالفترة",
      value: collected.amount,
      suffix: collected.label,
      change: collections.total_amount.change_pct,
      icon: "transaction_outlined",
    },
    {
      key: "overdue",
      // debts don't follow the date picker (dashboard_overview.md §4.1) — a running balance, not a period figure.
      label: "ديون متأخرة",
      value: overdue.amount,
      suffix: overdue.label,
      change: null,
      icon: "warning_outlined",
    },
    {
      key: "avgInvoice",
      label: "متوسط قيمة الفاتورة",
      value: avgInvoice.amount,
      suffix: avgInvoice.label,
      change: sales.average_amount.change_pct,
      icon: "price_outlined",
    },
    {
      key: "returnRate",
      label: "نسبة المرتجعات",
      value: `${returns.rate_pct.value}%`,
      change: returns.rate_pct.change_pct,
      icon: "undo_outlined",
    },
  ];
}

function buildStatusBars(overview: InvoicesOverview): {
  bars: OverviewDistributionBar[];
  total: number;
} {
  const bars: OverviewDistributionBar[] = overview.by_status.map((s) => ({
    key: s.status,
    label: STATUS_LABELS[s.status as SalesInvoiceStatus] ?? s.label,
    value: s.count,
  }));
  // A true partition of sales.invoice_count — "overdue" overlaps deferred/partially_paid
  // rather than being one more slice of it, so it's drawn but excluded from the total.
  const total = bars.reduce((sum, b) => sum + b.value, 0);
  bars.push({
    key: "overdue",
    label: "متأخرة",
    value: overview.debts.overdue.invoice_count,
    muted: true,
  });
  return { bars, total };
}

interface ActivityTileData {
  value: string | number;
  suffix?: string;
  change: number | null;
  label: string;
  sub: string;
}

interface ActivityGroupData {
  key: string;
  title: string;
  icon: iconName;
  tiles: ActivityTileData[];
}

function buildActivityGroups(overview: InvoicesOverview): ActivityGroupData[] {
  const { sales, collections, debts, currency } = overview;
  const periodLabel = `${formatDateShort(overview.period.date_from)} - ${formatDateShort(
    overview.period.date_to,
  )}`;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);
  const avgAmount = formatMoneyParts(sales.average_amount.value, currency.code);
  const cashAmount = formatMoneyParts(collections.cash_amount.value, currency.code);
  const creditAmount = formatMoneyParts(collections.credit_amount.value, currency.code);
  const overdueBalance = formatMoneyParts(debts.overdue.balance_due, currency.code);

  return [
    {
      key: "sales",
      title: "المبيعات",
      icon: "sales_outlined",
      tiles: [
        {
          value: totalAmount.amount,
          suffix: totalAmount.label,
          change: sales.total_amount.change_pct,
          label: "إجمالي المبيعات",
          sub: periodLabel,
        },
        {
          value: sales.invoice_count.value,
          change: sales.invoice_count.change_pct,
          label: "عدد الفواتير",
          sub: periodLabel,
        },
        {
          value: avgAmount.amount,
          suffix: avgAmount.label,
          change: sales.average_amount.change_pct,
          label: "متوسط الفاتورة",
          sub: periodLabel,
        },
      ],
    },
    {
      key: "collections",
      title: "التحصيل",
      icon: "transaction_outlined",
      tiles: [
        {
          value: cashAmount.amount,
          suffix: cashAmount.label,
          change: collections.cash_amount.change_pct,
          label: "محصّل نقداً",
          sub: periodLabel,
        },
        {
          value: creditAmount.amount,
          suffix: creditAmount.label,
          change: collections.credit_amount.change_pct,
          label: "محصّل من رصيد دائن",
          sub: periodLabel,
        },
      ],
    },
    {
      key: "debts",
      title: "الديون",
      icon: "report_outlined",
      tiles: [
        {
          value: overdueBalance.amount,
          suffix: overdueBalance.label,
          change: null,
          label: "ديون متأخرة",
          sub: `أكثر من ${debts.threshold_days} أيام`,
        },
        {
          value: debts.overdue.invoice_count,
          change: null,
          label: "فواتير متأخرة",
          sub: "بحاجة متابعة",
        },
      ],
    },
  ];
}

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 2, 2];

export function InvoicesOverview() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, isError, refetch } = useInvoicesOverviewQuery({
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  });
  const overview = data?.data;

  const kpis = useMemo(() => (overview ? buildKpis(overview) : []), [overview]);
  const statusDistribution = useMemo(
    () => (overview ? buildStatusBars(overview) : null),
    [overview],
  );
  const activityGroups = useMemo(
    () => (overview ? buildActivityGroups(overview) : []),
    [overview],
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateFilter mode="range" value={dateRange} onChange={setDateRange} />
        {overview?.fx.stale && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <IconRenderer name="warning_outlined" className="size-3.5" />
            أسعار الصرف قد تكون غير محدّثة
          </span>
        )}
      </div>

      {isError ? (
        <ErrorDisplay onRetry={() => refetch()} />
      ) : (
        <OverviewStatCardRow>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <OverviewStatCardSkeleton key={i} />)
            : kpis.map(({ key, ...item }) => <OverviewStatCard key={key} {...item} />)}
        </OverviewStatCardRow>
      )}

      <div
        className={`grid grid-cols-1 gap-4 sm:gap-5 ${isError ? "" : "lg:grid-cols-2"}`}
      >
        {!isError &&
          (isLoading || !statusDistribution ? (
            <OverviewDistributionChartSkeleton />
          ) : (
            <OverviewDistributionChart
              title="توزيع حالات الفواتير"
              total={statusDistribution.total}
              totalSuffix="فاتورة"
              bars={statusDistribution.bars}
            />
          ))}
        <InsightBanner />
      </div>

      <InvoiceInsights />

      {!isError && (
        <OverviewActivitySection>
          {isLoading
            ? ACTIVITY_SKELETON_GROUP_SIZES.map((count, gi) => (
                <div key={gi} className="shrink-0">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <div className="flex gap-3">
                    {Array.from({ length: count }).map((_, i) => (
                      <OverviewActivityTileSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ))
            : activityGroups.map((group) => (
                <OverviewActivityGroup key={group.key} icon={group.icon} title={group.title}>
                  {group.tiles.map((tile, i) => (
                    <OverviewActivityTile key={i} {...tile} />
                  ))}
                </OverviewActivityGroup>
              ))}
        </OverviewActivitySection>
      )}
    </div>
  );
}
