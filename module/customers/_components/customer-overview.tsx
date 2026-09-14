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
import { formatDateShort, formatMoneyParts } from "@/lib/format";
import { STATUS_LABEL as REQUEST_STATUS_LABEL } from "@/module/orders/lib/format";
import type { CustomerRequestStatus } from "@/module/orders/types";
import { useCustomerOverviewQuery } from "../hooks";
import type { CustomerOverview as CustomerOverviewData } from "../types";

// ---- AI cards — no backend endpoint yet (dashboard_overview.md §8), kept as illustrative copy ----

const FORECAST_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "عميل نشط جدًا",
    description:
      "يُعد هذا العميل من أكثر العملاء نشاطًا خلال الفترة الحالية، بمعدل ثلاث طلبات أسبوعيًا.",
  },
  {
    indicator: "info",
    label: "نمو إيجابي",
    description:
      "ارتفعت قيمة مشتريات العميل بنسبة 5% مقارنة بالفترة السابقة، مع احتمال استمرار هذا النمو.",
  },
  {
    indicator: "warning",
    label: "رصيد متبقٍ",
    description: "يوجد على العميل رصيد متبقٍ بقيمة 650,000 ل.س، يُنصح بمتابعة تحصيله.",
  },
];

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات أداء العميل خلال الفترة الحالية، وبافتراض استمرار المعدلات ذاتها حتى نهاية الشهر:";

const PERFORMANCE_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: "up" | "down" | "steady";
}[] = [
  {
    metric: "الطلبات",
    current: "الوضع الحالي: 15 طلبًا منذ بداية الشهر",
    projected: "التوقع: نحو 20 طلبًا بنهاية الشهر (+33%)",
    trend: "up",
  },
  {
    metric: "الزيارات",
    current: "الوضع الحالي: 8 زيارات خلال هذا الأسبوع",
    projected: "التوقع: استمرار النشاط بالمعدل ذاته",
    trend: "up",
  },
  {
    metric: "الرصيد المتبقي",
    current: "الوضع الحالي: 650,000 ل.س رصيد متبقٍ",
    projected: "التوقع: خطر ازدياد الرصيد في حال عدم المتابعة",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 4% من إجمالي الطلبات مرتجعة",
    projected: "التوقع: يُتوقع أن تبقى ضمن المعدل الطبيعي",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "متابعة الرصيد المتبقي مع العميل لضمان تحصيل المبالغ المستحقة.",
  "الاستمرار في تقديم العروض الخاصة لهذا العميل نظرًا لنشاطه.",
  "التنسيق مع المندوب المسند لزيادة عدد الزيارات الأسبوعية.",
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
        <span className="text-base sm:text-lg font-medium">تحليلات العملاء</span>
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
              aria-label={`تحليل ${i + 1}`}
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

function CustomerInsights() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name="ai_outlined" className="size-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-foreground">
          تحليل الأداء والتوقعات
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
          التوصيات المقترحة بناءً على هذه التوقعات
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

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 2, 2];

interface CustomerOverviewProps {
  customerId: string | number;
}

export default function CustomerOverview({ customerId }: CustomerOverviewProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, isError, refetch } = useCustomerOverviewQuery(customerId, {
    date_from: dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined,
    date_to: dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined,
  });
  const overview = data?.data;

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
          <InsightBanner />
        </div>

        <CustomerInsights />

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
    </div>
  );
}
