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
import { useRepOverviewQuery } from "../hooks";
import type { RepOverview as RepOverviewData } from "../types";

// ---- AI cards — no backend endpoint yet (dashboard_overview.md §8), kept as illustrative copy ----

const FORECAST_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "توقع بتجاوز الهدف",
    description:
      "بالمعدل الحالي، يُتوقع الوصول إلى 145 طلبًا بنهاية الشهر، بزيادة 5% عن الهدف المحدد.",
  },
  {
    indicator: "warning",
    label: "خطر فقدان عملاء",
    description:
      "في حال استمرار عدم زيارة خمسة محال تجارية لأسبوعين إضافيين، يُحتمل انتقالها إلى مندوب آخر.",
  },
  {
    indicator: "info",
    label: "تغطية العملاء",
    description:
      "بمعدل الزيارات الحالي، سيتم تغطية جميع العملاء المسندين خلال ثلاثة أسابيع.",
  },
];

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات أداء المندوب خلال الفترة الحالية، وبافتراض استمرار المعدلات ذاتها حتى نهاية الشهر:";

const PERFORMANCE_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: "up" | "down" | "steady";
}[] = [
  {
    metric: "الطلبات",
    current: "الوضع الحالي: 128 طلبًا منذ بداية الشهر",
    projected: "التوقع: نحو 145 طلبًا بنهاية الشهر (+13%)",
    trend: "up",
  },
  {
    metric: "الزيارات",
    current: "الوضع الحالي: 31 زيارة خلال هذا الأسبوع",
    projected: "التوقع: تغطية جميع العملاء المسندين خلال ثلاثة أسابيع بالمعدل ذاته",
    trend: "up",
  },
  {
    metric: "العملاء غير المُزارين",
    current: "الوضع الحالي: خمسة محال دون زيارة منذ أكثر من أسبوع",
    projected: "التوقع: خطر فقدان عميل أو عميلين خلال أسبوعين في حال استمرار الوضع",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 11% من إجمالي الطلبات مرتجعة",
    projected: "التوقع: يُتوقع أن تبقى ضمن المعدل الطبيعي (10-12%)",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "جدولة زيارة للعملاء الخمسة الذين لم تتم زيارتهم هذا الأسبوع قبل أن يتحولوا إلى مندوب آخر.",
  "الحفاظ على المعدل الحالي للطلبات من أجل تحقيق هدف الشهر أو تجاوزه.",
  "متابعة أسباب نسبة المرتجعات بشكل دوري للإبقاء عليها ضمن الحد الطبيعي.",
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

function RepInsights() {
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
          ما الذي يجب أن يقوم به المندوب بناءً على هذه التوقعات
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

function buildKpis(overview: RepOverviewData): Kpi[] {
  const { sales, visits, customer_requests, customers, currency } = overview;
  const totalAmount = formatMoneyParts(sales.total_amount.value, currency.code);

  return [
    {
      key: "assignedCustomers",
      label: "العملاء المسندون",
      value: customers.assigned.value,
      change: customers.assigned.change_pct,
      icon: "users_outlined",
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
      label: "قيمة المبيعات",
      value: totalAmount.amount,
      suffix: totalAmount.label,
      change: sales.total_amount.change_pct,
      icon: "revenue_outlined",
    },
    {
      key: "newCustomers",
      label: "عملاء جدد (عبر الإحالة)",
      value: customers.new_via_referral.value,
      change: customers.new_via_referral.change_pct,
      icon: "add_user_outlined",
    },
    {
      key: "awaitingDelivery",
      // a queue — waiting on the rep to deliver, doesn't follow the date picker.
      label: "بانتظار التسليم",
      value: customer_requests.awaiting_delivery_count,
      change: null,
      icon: "clock_outlined",
    },
    {
      key: "visits",
      label: "الزيارات (آخر 7 أيام)",
      value: visits.count.value,
      change: visits.count.change_pct,
      icon: "map_outlined",
    },
  ];
}

function buildRequestBars(overview: RepOverviewData): {
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

function buildActivityGroups(overview: RepOverviewData): ActivityGroupData[] {
  const { sales, visits, customer_requests, customers, currency } = overview;
  const periodLabel = `${formatDateShort(overview.period.date_from)} - ${formatDateShort(
    overview.period.date_to,
  )}`;
  const visitsWindowLabel = `${formatDateShort(visits.window.date_from)} - ${formatDateShort(
    visits.window.date_to,
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
          sub: "بانتظار رد المندوب",
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
          value: visits.unvisited_customer_count,
          change: null,
          label: "محال لم تُزَر",
          sub: "خلال هذا الأسبوع",
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
      key: "customers",
      title: "العملاء",
      icon: "users_outlined",
      tiles: [
        {
          value: customers.assigned.value,
          change: customers.assigned.change_pct,
          label: "إجمالي العملاء",
          sub: "مسندون للمندوب",
        },
        {
          value: customers.new_via_referral.value,
          change: customers.new_via_referral.change_pct,
          label: "عملاء جدد",
          sub: "عبر كود الإحالة",
        },
      ],
    },
  ];
}

const ACTIVITY_SKELETON_GROUP_SIZES = [3, 3, 2];

interface RepOverviewProps {
  repId: string | number;
}

export default function RepOverview({ repId }: RepOverviewProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, isError, refetch } = useRepOverviewQuery(repId, {
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

        <RepInsights />

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
