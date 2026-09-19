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
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { formatQuantity } from "@/module/invoices/lib/format";
import { formatDateShort, formatMoneyParts, formatMoney } from "@/lib/format";
import { STATUS_LABEL as REQUEST_STATUS_LABEL } from "@/module/orders/lib/format";
import type { CustomerRequestStatus } from "@/module/orders/types";
import {
  useCompanyInsightsQuery,
  useCompanyOverviewQuery,
} from "@/module/dashboard/hooks";
import type { CompanyOverview } from "@/module/dashboard/types";

// ---- Real data: KPI row, request distribution, leaderboards and activity section ----

const RANK_STYLE = [
  "bg-amber-500/15 text-amber-600",
  "bg-slate-400/15 text-slate-500",
  "bg-orange-500/15 text-orange-600",
];

interface Kpi {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change: number | null;
  icon: iconName;
}

function buildKpis(overview: CompanyOverview): Kpi[] {
  const { sales, invoices, customer_requests, customers, reps, currency } = overview;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);

  return [
    {
      key: "activeReps",
      label: "المناديب النشطون",
      value: reps.active.value,
      change: reps.active.change_pct,
      icon: "users_outlined",
    },
    {
      key: "customers",
      label: "إجمالي الزبائن",
      value: customers.company_total.value,
      change: customers.company_total.change_pct,
      icon: "contacts_outlined",
    },
    {
      key: "requests",
      label: "الطلبات",
      value: customer_requests.count.value,
      change: customer_requests.count.change_pct,
      icon: "cart_outlined",
    },
    {
      key: "sales",
      label: "إجمالي المبيعات",
      value: totalAmount.amount,
      suffix: totalAmount.label,
      change: sales.total_amount.change_pct,
      icon: "revenue_outlined",
    },
    {
      key: "invoices",
      label: "الفواتير (وارد/مرتجع)",
      value: invoices.total_count.value,
      change: invoices.total_count.change_pct,
      icon: "payment_outlined",
    },
    {
      key: "newCustomers",
      label: "زبائن جدد (عبر الإحالة)",
      value: customers.new_via_referral.value,
      change: customers.new_via_referral.change_pct,
      icon: "add_user_outlined",
    },
  ];
}

function buildRequestBars(overview: CompanyOverview): {
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

function buildActivityGroups(overview: CompanyOverview): ActivityGroupData[] {
  const { sales, invoices, customer_requests, customers, reps, stock_transfers, currency } =
    overview;
  const periodLabel = `${formatDateShort(overview.period.date_from)} - ${formatDateShort(
    overview.period.date_to,
  )}`;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);

  return [
    {
      key: "requests",
      title: "الطلبات",
      icon: "cart_outlined",
      tiles: [
        {
          value: totalAmount.amount,
          suffix: totalAmount.label,
          change: sales.total_amount.change_pct,
          label: "إجمالي المبيعات",
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
          sub: "بانتظار الرد",
        },
      ],
    },
    {
      key: "invoices",
      title: "الفواتير",
      icon: "payment_outlined",
      tiles: [
        {
          value: invoices.incoming.count.value,
          change: invoices.incoming.count.change_pct,
          label: "فواتير إدخال",
          sub: periodLabel,
        },
        {
          value: invoices.returns.count.value,
          change: invoices.returns.count.change_pct,
          label: "فواتير مرتجع",
          sub: periodLabel,
        },
      ],
    },
    {
      key: "customers",
      title: "الزبائن",
      icon: "contacts_outlined",
      tiles: [
        {
          value: customers.company_total.value,
          change: customers.company_total.change_pct,
          label: "إجمالي الزبائن",
          sub: "على مستوى الشركة",
        },
        {
          value: customers.new_via_referral.value,
          change: customers.new_via_referral.change_pct,
          label: "زبائن جدد",
          sub: "عبر كود الإحالة",
        },
      ],
    },
    {
      key: "reps",
      title: "المناديب",
      icon: "users_outlined",
      tiles: [
        {
          value: reps.active.value,
          change: reps.active.change_pct,
          label: "مناديب نشطون",
          sub: "الحالة الحالية",
        },
        {
          value: reps.new.value,
          change: reps.new.change_pct,
          label: "مناديب جدد",
          sub: periodLabel,
        },
        {
          value: stock_transfers.pending_approval_count,
          change: null,
          label: "تحويلات بانتظار الموافقة",
          sub: "قيد المراجعة",
        },
      ],
    },
  ];
}

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 2, 2, 3];

function TopRepsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRepsSection({
  topReps,
  currencyCode,
  periodLabel,
}: {
  topReps: CompanyOverview["top_reps"];
  currencyCode: string;
  periodLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-medium text-foreground">
          أفضل المناديب أداءً
        </h2>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
      </div>
      {topReps.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          لا توجد بيانات مبيعات ضمن هذه الفترة
        </p>
      ) : (
        <ul className="space-y-1">
          {topReps.map((rep, i) => {
            const hasChange = rep.change_pct != null;
            const isUp = (rep.change_pct ?? 0) >= 0;
            return (
              <li key={rep.rep_id}>
                <EntityLink
                  href={`/reps/detail?id=${rep.rep_id}`}
                  className="flex items-center gap-3 py-2 rounded-xl hover:bg-muted/40 px-1.5 no-underline hover:no-underline"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      RANK_STYLE[i] ?? "bg-primary/10 text-primary"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {rep.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {rep.invoice_count} فاتورة
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatMoney(rep.total_amount, currencyCode)}
                    </div>
                    {hasChange && (
                      <div
                        className={`text-[11px] flex items-center justify-end gap-0.5 ${
                          isUp ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        <IconRenderer
                          name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                          className="size-2.5"
                        />
                        {Math.abs(rep.change_pct as number)}%
                      </div>
                    )}
                  </div>
                </EntityLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TopProductsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <Skeleton className="h-5 w-44 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsSection({
  topProducts,
  currencyCode,
  periodLabel,
}: {
  topProducts: CompanyOverview["top_products"];
  currencyCode: string;
  periodLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-medium text-foreground">
          الأكثر مبيعًا من المنتجات
        </h2>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
      </div>
      {topProducts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          لا توجد بيانات مبيعات ضمن هذه الفترة
        </p>
      ) : (
        <ul className="space-y-1">
          {topProducts.map((product) => {
            const hasChange = product.change_pct != null;
            const isUp = (product.change_pct ?? 0) >= 0;
            return (
              <li key={product.product_id}>
                <EntityLink
                  href={`/products/detail?id=${product.product_id}`}
                  className="flex items-center gap-3 py-2 rounded-xl hover:bg-muted/40 px-1.5 no-underline hover:no-underline"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <IconRenderer name="category_outlined" className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatQuantity(product.quantity_sold)} قطعة مباعة
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatMoney(product.total_amount, currencyCode)}
                    </div>
                    {hasChange && (
                      <div
                        className={`text-[11px] flex items-center justify-end gap-0.5 ${
                          isUp ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        <IconRenderer
                          name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                          className="size-2.5"
                        />
                        {Math.abs(product.change_pct as number)}%
                      </div>
                    )}
                  </div>
                </EntityLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function PlatformOverview() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Overview and insights get the exact same params so the sentence and the cards describe the same period.
  const params = {
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  };
  const { data, isLoading, isError, refetch } = useCompanyOverviewQuery(params);
  const overview = data?.data?.overview;
  const insightsQuery = useCompanyInsightsQuery(params);
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
  const periodLabel = overview
    ? `${formatDateShort(overview.period.date_from)} - ${formatDateShort(overview.period.date_to)}`
    : "";

  return (
    <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            نظرة عامة على المنصة
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            ملخص شامل للمناديب، الزبائن، الطلبات، الفواتير والمنتجات
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter mode="range" value={dateRange} onChange={setDateRange} />
          {overview?.fx.stale && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600">
              <IconRenderer name="warning_outlined" className="size-3.5" />
              أسعار الصرف قد تكون غير محدّثة
            </span>
          )}
        </div>
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
          (isLoading || !requestDistribution ? (
            <OverviewDistributionChartSkeleton />
          ) : (
            <OverviewDistributionChart
              title="توزيع الطلبات — كل الشركة"
              total={requestDistribution.total}
              totalSuffix="طلب"
              bars={requestDistribution.bars}
            />
          ))}
        <InsightBanner insights={insights} isLoading={insightsQuery.isLoading} />
      </div>

      {!isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {isLoading || !overview ? (
            <>
              <TopRepsSkeleton />
              <TopProductsSkeleton />
            </>
          ) : (
            <>
              <TopRepsSection
                topReps={overview.top_reps}
                currencyCode={overview.currency.code}
                periodLabel={periodLabel}
              />
              <TopProductsSection
                topProducts={overview.top_products}
                currencyCode={overview.currency.code}
                periodLabel={periodLabel}
              />
            </>
          )}
        </div>
      )}

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
