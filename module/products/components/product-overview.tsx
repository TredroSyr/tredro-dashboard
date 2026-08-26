"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";

const PRODUCT = {
  name: "زيت زيتون بكر ممتاز 1 لتر",
  sku: "OIL-1L-001",
  category: "زيوت وسمن",
  avatarInitials: "ز ز",
};

const KPIS: {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change?: number | null;
  icon: iconName;
}[] = [
  {
    key: "unitsSold",
    label: "الوحدات المباعة هالشهر",
    value: 1240,
    change: 15,
    icon: "cart_outlined",
  },
  {
    key: "revenue",
    label: "قيمة المبيعات",
    value: "42,300,000",
    suffix: "ل.س",
    change: 9,
    icon: "revenue_outlined",
  },
  {
    key: "avgPrice",
    label: "متوسط سعر البيع",
    value: "34,100",
    suffix: "ل.س",
    change: -2,
    icon: "revenue_outlined",
  },
  {
    key: "stock",
    label: "المخزون الحالي",
    value: 318,
    change: -6,
    icon: "clock_outlined",
  },
  {
    key: "orders",
    label: "عدد الطلبيات",
    value: 96,
    change: 11,
    icon: "cart_outlined",
  },
  {
    key: "returns",
    label: "نسبة المرتجع",
    value: "3.2%",
    change: -1,
    icon: "warning_outlined",
  },
];

const SALES_DISTRIBUTION = [
  { label: "مفرّق", value: 640 },
  { label: "جملة", value: 410 },
  { label: "أونلاين", value: 150 },
  { label: "مرتجع", value: 40 },
];

const ACTIVITY_GROUPS: {
  key: string;
  title: string;
  icon: iconName;
  tiles: {
    value: string | number;
    suffix?: string;
    change: number | null;
    label: string;
    sub?: string;
  }[];
}[] = [
  {
    key: "sales",
    title: "المبيعات",
    icon: "cart_outlined",
    tiles: [
      {
        value: "42,300,000",
        suffix: "ل.س",
        change: 9,
        label: "إجمالي المبيعات",
        sub: "آخر 30 يوم",
      },
      { value: 1240, change: 15, label: "الوحدات المباعة", sub: "آخر 30 يوم" },
      { value: 96, change: 11, label: "عدد الطلبيات", sub: "آخر 30 يوم" },
    ],
  },
  {
    key: "stock",
    title: "المخزون",
    icon: "clock_outlined",
    tiles: [
      { value: 318, change: -6, label: "الكمية المتوفرة", sub: "بالمستودع" },
      { value: 12, change: 4, label: "نقطة إعادة الطلب", sub: "الحد الأدنى" },
    ],
  },
  {
    key: "customers",
    title: "الزبائن",
    icon: "users_outlined",
    tiles: [
      { value: 58, change: 7, label: "زبائن اشتروا المنتج", sub: "آخر 30 يوم" },
      { value: 9, change: 20, label: "زبائن جدد", sub: "أول مرة يشتروا" },
    ],
  },
];

const FORECAST_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "منتج قوي المبيعات",
    description:
      "بمعدل المبيعات الحالي، متوقع يتباع 1,420 وحدة نهاية الشهر — أعلى من هدفك بـ 8%.",
  },
  {
    indicator: "warning",
    label: "خطر نفاد المخزون",
    description:
      "بمعدل الاستهلاك الحالي، المخزون رح يخلص خلال 12 يوم تقريباً، لازم إعادة طلب.",
  },
  {
    indicator: "info",
    label: "أداء السعر",
    description:
      "متوسط سعر البيع تراجع 2% هالشهر، راقب هامش الربح مقارنة بتكلفة الشراء.",
  },
];

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات أداء المنتج خلال الفترة الحالية، وبافتراض استمرار نفس المعدلات لنهاية الشهر:";

const PERFORMANCE_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: "up" | "down" | "steady";
}[] = [
  {
    metric: "المبيعات",
    current: "الوضع الحالي: 1,240 وحدة منذ بداية الشهر",
    projected: "التوقع: ≈ 1,420 وحدة نهاية الشهر (+15%)",
    trend: "up",
  },
  {
    metric: "المخزون",
    current: "الوضع الحالي: 318 وحدة متبقية",
    projected: "التوقع: نفاد المخزون خلال 12 يوم بنفس معدل البيع",
    trend: "down",
  },
  {
    metric: "متوسط السعر",
    current: "الوضع الحالي: 34,100 ل.س للوحدة",
    projected: "التوقع: انخفاض طفيف إضافي إذا استمرت الخصومات الحالية",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 3.2% من إجمالي الطلبيات",
    projected: "التوقع: بتضل ثابتة ضمن المعدل الطبيعي (2-4%)",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "إعادة طلب المخزون بأسرع وقت لتفادي النفاد خلال أسبوعين.",
  "مراجعة سياسة التسعير الحالية للحفاظ على هامش الربح.",
  "متابعة أسباب المرتجعات بشكل دوري حتى تضل ضمن الحد الطبيعي.",
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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const state = useRef({ startX: 0, startLeft: 0 });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    setDragging(true);
    state.current.startX = e.clientX;
    state.current.startLeft = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const el = ref.current;
    if (!el) return;
    el.scrollLeft =
      state.current.startLeft - (e.clientX - state.current.startX);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    ref.current?.releasePointerCapture(e.pointerId);
  };

  return {
    ref,
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

function KpiCardSkeleton() {
  return (
    <div className="shrink-0 w-[150px] sm:w-auto rounded-2xl border border-border bg-card p-3.5 sm:p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function KpiCard({ item }: { item: (typeof KPIS)[number] }) {
  const change = item.change ?? null;
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="shrink-0 w-[150px] sm:w-auto rounded-2xl border border-border bg-card p-3.5 sm:p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name={item.icon} className="size-4" />
        </div>
        {change != null && (
          <span
            className={`text-[11px] font-medium flex items-center gap-0.5 ${
              isUp ? "text-emerald-600" : "text-red-500"
            }`}
          >
            <IconRenderer
              name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
              className="size-3"
            />
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-xl sm:text-2xl font-semibold text-foreground truncate">
          {item.value}
        </span>
        {item.suffix && (
          <span className="text-xs text-muted-foreground">{item.suffix}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground truncate">
        {item.label}
      </span>
    </div>
  );
}

function KpiRow({ loading }: { loading: boolean }) {
  const drag = useDragScroll();

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={drag.ref}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
      className={`flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible ${
        drag.dragging
          ? "cursor-grabbing select-none"
          : "cursor-grab sm:cursor-auto"
      }`}
    >
      {KPIS.map((item) => (
        <KpiCard key={item.key} item={item} />
      ))}
    </div>
  );
}

function SalesDistributionSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-16 mt-3" />
      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {[60, 90, 40, 70].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-28 sm:h-32 flex items-end">
              <Skeleton
                className="w-full"
                style={{ height: `${h}%` } as React.CSSProperties}
              />
            </div>
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesDistributionCard() {
  const [sel, setSel] = useState(0);
  const values = SALES_DISTRIBUTION.map((d) => d.value);
  const total = values.reduce((s, v) => s + v, 0);
  const maxV = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          توزيع المبيعات
        </span>
        <IconRenderer
          name="arrow_up_right_outlined"
          className="size-4 text-muted-foreground"
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">وحدة</span>
      </div>

      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {SALES_DISTRIBUTION.map((d, i) => {
          const isSel = sel === i;
          const h = (d.value / maxV) * 100;
          return (
            <button
              key={d.label}
              onClick={() => setSel(i)}
              className="flex-1 flex flex-col items-center gap-2 min-w-0"
            >
              <div className="w-full h-28 sm:h-32 flex items-end">
                <div
                  className={`w-full rounded-md transition-all ${
                    isSel ? "bg-primary" : "bg-primary/15"
                  }`}
                  style={{ height: `${h}%` }}
                >
                  {isSel && (
                    <div className="w-full text-center pt-1">
                      <span className="text-[11px] font-semibold text-primary-foreground">
                        {d.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-full text-center">
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InsightBannerSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 h-full min-h-[220px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-1.5 w-5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

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
            className={`size-4 mt-0.5 shrink-0 ${
              INDICATOR_ICON_CLASS[current.indicator]
            }`}
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

function ProductInsightsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="space-y-2 mb-5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl bg-muted/40 p-3"
          >
            <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border space-y-2">
        <Skeleton className="h-3.5 w-48 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function ProductInsights() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name="ai_outlined" className="size-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-foreground">
          تحليل أداء المنتج والتوقعات
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {ANALYSIS_INTRO}
      </p>

      <ul className="space-y-3">
        {PERFORMANCE_PROJECTIONS.map((p, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-xl bg-muted/40 p-3"
          >
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                TREND_CLASS[p.trend]
              }`}
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
          شو لازم يعمل المسؤول عن المنتج بناءً عالتوقعات
        </h3>
        <ul className="list-disc ps-5 space-y-2">
          {PERFORMANCE_RECOMMENDATIONS.map((rec, idx) => (
            <li
              key={idx}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActivityTileSkeleton() {
  return (
    <div className="shrink-0 w-[150px] sm:w-[164px] rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[140px]">
      <Skeleton className="h-6 w-16" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2.5 w-14" />
      </div>
    </div>
  );
}

function ActivityStatTile({
  tile,
}: {
  tile: (typeof ACTIVITY_GROUPS)[number]["tiles"][number];
}) {
  const isUp = (tile.change ?? 0) >= 0;
  return (
    <div className="shrink-0 w-[150px] sm:w-[164px] rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[140px]">
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-semibold text-foreground truncate">
          {tile.value}
        </span>
        {tile.suffix && (
          <span className="text-[11px] text-muted-foreground">
            {tile.suffix}
          </span>
        )}
        {tile.change != null && (
          <IconRenderer
            name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
            className={`size-3.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}
          />
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-foreground">{tile.label}</div>
        <div className="text-[11px] text-muted-foreground">{tile.sub}</div>
      </div>
    </div>
  );
}

function ActivitySection({ loading }: { loading: boolean }) {
  const drag = useDragScroll();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex min-w-max gap-6 sm:gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {ACTIVITY_GROUPS.map((group) => (
            <div key={group.key} className="shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex gap-3">
                {group.tiles.map((_, i) => (
                  <ActivityTileSkeleton key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div
        ref={drag.ref}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
        className={`overflow-x-auto [&::-webkit-scrollbar]:hidden ${
          drag.dragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        <div className="flex min-w-max gap-6 sm:gap-8">
          {ACTIVITY_GROUPS.map((group) => (
            <div key={group.key} className="shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <IconRenderer
                  name={group.icon}
                  className="size-4 text-muted-foreground"
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {group.title}
                </h3>
              </div>
              <div className="flex gap-3">
                {group.tiles.map((tile, i) => (
                  <ActivityStatTile key={i} tile={tile} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProductOverviewProps {
  isLoading?: boolean;
}

export default function ProductOverview({
  isLoading = false,
}: ProductOverviewProps) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
      <KpiRow loading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {isLoading ? <SalesDistributionSkeleton /> : <SalesDistributionCard />}
        {isLoading ? <InsightBannerSkeleton /> : <InsightBanner />}
      </div>

      {isLoading ? <ProductInsightsSkeleton /> : <ProductInsights />}

      <ActivitySection loading={isLoading} />
    </div>
  );
}
