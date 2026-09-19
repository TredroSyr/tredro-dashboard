"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { DateFilter } from "@/components/tredro/date-filter";
import {
  InsightBanner,
  shouldShowInsights,
} from "@/components/tredro/insight-banner";
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
import { useInvoicesInsightsQuery, useInvoicesOverviewQuery } from "../hooks";
import { formatDateShort, formatMoneyParts } from "../lib/format";
import type { InvoicesOverview, SalesInvoiceStatus } from "../types";

const STATUS_LABELS: Record<SalesInvoiceStatus, string> = {
  fully_paid: "مدفوعة بالكامل",
  partially_paid: "مدفوعة جزئياً",
  deferred: "آجلة",
};

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

  // Overview and insights get the exact same params so the sentence and the cards describe the same period.
  const params = {
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  };
  const { data, isLoading, isError, refetch } = useInvoicesOverviewQuery(params);
  const overview = data?.data;
  const insightsQuery = useInvoicesInsightsQuery(params);
  const insights = insightsQuery.data?.data?.insights ?? [];
  const showInsights = shouldShowInsights(insightsQuery.isLoading, insights);

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
        className={`grid grid-cols-1 gap-4 sm:gap-5 ${
        isError || !showInsights ? "" : "lg:grid-cols-2"
      }`}
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
        <InsightBanner insights={insights} isLoading={insightsQuery.isLoading} />
      </div>

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
