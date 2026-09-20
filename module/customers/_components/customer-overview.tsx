"use client";

import { useMemo } from "react";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { useOverviewFilters } from "@/components/tredro/overview-toolbar";
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
import { formatDateShort, formatMoneyParts } from "@/lib/format";
import { STATUS_LABEL as REQUEST_STATUS_LABEL } from "@/module/orders/lib/format";
import type { CustomerRequestStatus } from "@/module/orders/types";
import { useCustomerInsightsQuery, useCustomerOverviewQuery } from "../hooks";
import type { CustomerOverview as CustomerOverviewData } from "../types";

// ---- Real data: KPI row, request distribution and activity section ----

interface Kpi {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change: number | null;
  icon: iconName;
}

function buildKpis(overview: CustomerOverviewData): Kpi[] {
  const { purchases, customer_requests, reps, currency } = overview;
  const totalAmount = formatMoneyParts(purchases.total_amount.value, currency.code);
  const avgAmount = formatMoneyParts(purchases.average_amount.value, currency.code);

  return [
    {
      key: "requests",
      label: "الطلبات",
      value: customer_requests.count.value,
      change: customer_requests.count.change_pct,
      icon: "cart_outlined",
    },
    {
      key: "purchases",
      label: "إجمالي المشتريات",
      value: totalAmount.amount,
      suffix: totalAmount.label,
      change: purchases.total_amount.change_pct,
      icon: "revenue_outlined",
    },
    {
      key: "lastPurchase",
      // no honest "previous" reading for a timestamp — no change arrow.
      label: "آخر عملية شراء",
      value: formatDateShort(purchases.last_invoice_at),
      change: null,
      icon: "clock_outlined",
    },
    {
      key: "avgOrder",
      label: "متوسط الطلبية",
      value: avgAmount.amount,
      suffix: avgAmount.label,
      change: purchases.average_amount.change_pct,
      icon: "price_outlined",
    },
    {
      key: "totalRequests",
      // all-time count — the whole relationship, not scoped to the date picker.
      label: "إجمالي الطلبات (كل الوقت)",
      value: customer_requests.total_count,
      change: null,
      icon: "cart_outlined",
    },
    {
      key: "assignedReps",
      label: "المندوبون المسندون",
      value: reps.assigned.value,
      change: reps.assigned.change_pct,
      icon: "users_outlined",
    },
  ];
}

function buildRequestBars(overview: CustomerOverviewData): {
  bars: OverviewDistributionBar[];
  total: number;
} {
  const bars: OverviewDistributionBar[] = overview.customer_requests.by_status.map(
    (s) => ({
      key: s.status,
      label: REQUEST_STATUS_LABEL[s.status as CustomerRequestStatus] ?? s.label,
      value: s.count,
    }),
  );
  const total = bars.reduce((sum, b) => sum + b.value, 0);
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

function buildActivityGroups(overview: CustomerOverviewData): ActivityGroupData[] {
  const { purchases, payments, visits, customer_requests, currency } = overview;
  const periodLabel = `${formatDateShort(overview.period.date_from)} - ${formatDateShort(
    overview.period.date_to,
  )}`;
  const visitsWindowLabel = `${formatDateShort(visits.window.date_from)} - ${formatDateShort(
    visits.window.date_to,
  )}`;
  const totalAmount = formatMoneyParts(purchases.total_amount.value, currency.code);
  const collected = formatMoneyParts(payments.collected.value, currency.code);
  const outstanding = formatMoneyParts(payments.outstanding.balance_due, currency.code);

  return [
    {
      key: "requests",
      title: "الطلبات",
      icon: "cart_outlined",
      tiles: [
        {
          value: totalAmount.amount,
          suffix: totalAmount.label,
          change: purchases.total_amount.change_pct,
          label: "إجمالي المشتريات",
          sub: periodLabel,
        },
        {
          value: customer_requests.count.value,
          change: customer_requests.count.change_pct,
          label: "عدد الطلبات",
          sub: periodLabel,
        },
        {
          value: customer_requests.pending_count,
          change: null,
          label: "طلبات قيد الانتظار",
          sub: "قيد التجهيز",
        },
      ],
    },
    {
      key: "visits",
      title: "الزيارات",
      icon: "map_outlined",
      tiles: [
        {
          value: visits.count.value,
          change: visits.count.change_pct,
          label: "الزيارات",
          sub: visitsWindowLabel,
        },
        {
          value: visits.days_since_last_visit ?? "—",
          change: null,
          label: "أيام منذ آخر زيارة",
          sub: visits.last_visit_at ? "آخر نشاط مسجَّل" : "لم تتم زيارته بعد",
        },
      ],
    },
    {
      key: "payments",
      title: "المدفوعات",
      icon: "payment_outlined",
      tiles: [
        {
          value: collected.amount,
          suffix: collected.label,
          change: payments.collected.change_pct,
          label: "المبلغ المحصَّل",
          sub: periodLabel,
        },
        {
          value: outstanding.amount,
          suffix: outstanding.label,
          // all-time — doesn't follow the date picker.
          change: null,
          label: "الرصيد المتبقي",
          sub: "كل الوقت",
        },
      ],
    },
  ];
}

function hasOverviewShape(value: unknown): value is CustomerOverviewData {
  if (!value || typeof value !== "object") return false;
  const o = value as Partial<CustomerOverviewData>;
  return Boolean(
    o.currency && o.period && o.purchases && o.payments && o.visits && o.customer_requests && o.reps,
  );
}

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 2, 2];

interface CustomerOverviewProps {
  customerId: string | number;
  /** Owned by the page header, which renders the period + currency controls. */
  filters: ReturnType<typeof useOverviewFilters>;
}

export default function CustomerOverview({ customerId, filters }: CustomerOverviewProps) {
  // Overview and insights get the exact same params so the sentence and the cards describe the same period and currency.
  const { params } = filters;
  const { data, isLoading, isError, refetch } = useCustomerOverviewQuery(customerId, params);
  const rawOverview = data?.data?.overview;
  // Everything below reads these sections unguarded, so a response that doesn't match `CustomerOverview` is treated as an error instead of crashing render.
  const isValidOverview = hasOverviewShape(rawOverview);
  const overview = isValidOverview ? rawOverview : undefined;
  const isShapeError = !isLoading && !isError && data !== undefined && !isValidOverview;
  if (isShapeError) {
    console.error("[CustomerOverview] unexpected overview response shape:", data);
  }
  const hasError = isError || isShapeError;
  const insightsQuery = useCustomerInsightsQuery(customerId, params);
  const insights = insightsQuery.data?.data?.insights ?? [];
  const showInsights = shouldShowInsights(insightsQuery.isLoading, insights);

  const kpis = useMemo(() => (overview ? buildKpis(overview) : []), [overview]);
  const requestDistribution = useMemo(
    () => (overview ? buildRequestBars(overview) : null),
    [overview],
  );
  const activityGroups = useMemo(
    () => (overview ? buildActivityGroups(overview) : []),
    [overview],
  );

  return (
    <div dir="rtl" className="w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
        {overview?.fx.stale && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600">
            <IconRenderer name="warning_outlined" className="size-3.5" />
            أسعار الصرف قد تكون غير محدّثة
          </span>
        )}

        {hasError ? (
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
          hasError || !showInsights ? "" : "lg:grid-cols-2"
        }`}
        >
          {!hasError &&
            (isLoading || !requestDistribution ? (
              <OverviewDistributionChartSkeleton />
            ) : (
              <OverviewDistributionChart
                title="توزيع الطلبات"
                total={requestDistribution.total}
                totalSuffix="طلب"
                bars={requestDistribution.bars}
              />
            ))}
          <InsightBanner insights={insights} isLoading={insightsQuery.isLoading} />
        </div>

        {!hasError && (
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
    </div>
  );
}
