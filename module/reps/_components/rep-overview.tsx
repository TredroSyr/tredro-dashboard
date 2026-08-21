"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";

/* ============================================================
   Dummy Data (بديل مؤقت لحد ما نربط الـ API)
   ============================================================ */

const REP = {
  name: "محمد الأحمد",
  type: "مندوب مفرّق",
  avatarInitials: "م أ",
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
    key: "customers",
    label: "الزبائن المسندين",
    value: 42,
    change: 8,
    icon: "users_outlined",
  },
  {
    key: "orders",
    label: "الطلبيات هالشهر",
    value: 128,
    change: 12,
    icon: "cart_outlined",
  },
  {
    key: "revenue",
    label: "قيمة المبيعات",
    value: "18,450,000",
    suffix: "ل.س",
    change: 5,
    icon: "revenue_outlined",
  },
  {
    key: "newCustomers",
    label: "زبائن جدد (إحالة)",
    value: 6,
    change: 20,
    icon: "add_user_outlined",
  },
  {
    key: "pending",
    label: "بانتظار التسليم",
    value: 4,
    change: -10,
    icon: "clock_outlined",
  },
  {
    key: "visits",
    label: "الزيارات هالأسبوع",
    value: 31,
    change: 3,
    icon: "map_outlined",
  },
];

const ORDERS_DISTRIBUTION = [
  { label: "مكتملة", value: 86 },
  { label: "قيد الانتظار", value: 22 },
  { label: "مرتجعة", value: 14 },
  { label: "ملغية", value: 6 },
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
    key: "orders",
    title: "الطلبيات",
    icon: "cart_outlined",
    tiles: [
      {
        value: "18,450,000",
        suffix: "ل.س",
        change: 12,
        label: "إجمالي المبيعات",
        sub: "آخر 30 يوم",
      },
      { value: 128, change: 8, label: "عدد الطلبيات", sub: "آخر 30 يوم" },
      { value: 4, change: -15, label: "طلبيات معلّقة", sub: "بانتظار الشركة" },
    ],
  },
  {
    key: "visits",
    title: "الزيارات",
    icon: "map_outlined",
    tiles: [
      { value: 31, change: 4, label: "زيارات هالأسبوع", sub: "آخر 7 أيام" },
      { value: 5, change: -6, label: "محلات غير مزارة", sub: "هالأسبوع" },
    ],
  },
  {
    key: "customers",
    title: "الزبائن",
    icon: "users_outlined",
    tiles: [
      { value: 42, change: 8, label: "إجمالي الزبائن", sub: "مسندين للمندوب" },
      { value: 6, change: 20, label: "زبائن جدد", sub: "عبر كود الإحالة" },
    ],
  },
];

const INSIGHT_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "warning",
    label: "زبائن ما تمت زيارتهم",
    description: "5 محلات مسندة للمندوب لم تُزَر خلال آخر 7 أيام.",
  },
  {
    indicator: "error",
    label: "طلبية متأخرة",
    description: "طلبية بانتظار التسليم منذ أكثر من يومين، تحتاج متابعة.",
  },
  {
    indicator: "success",
    label: "أداء ممتاز هالشهر",
    description: "عدد الطلبيات المكتملة ارتفع 12% مقارنة بالشهر الماضي.",
  },
];

const PERFORMANCE_SUMMARY =
  "أداء المندوب هالشهر أعلى من المعدل المعتاد، مع ارتفاع ملحوظ بعدد الطلبيات المكتملة. بالمقابل في محلات ما زارها منذ فترة، وهاد ممكن يأثر عالمبيعات إذا استمر.";

const PERFORMANCE_INSIGHTS: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "نمو بالمبيعات",
    description:
      "المبيعات ارتفعت 12% مقارنة بالشهر الماضي، وهيدا أعلى معدل نمو بين المناديب هالفترة.",
  },
  {
    indicator: "warning",
    label: "زيارات متأخرة",
    description:
      "5 زبائن ما تمت زيارتهم من أكثر من أسبوع، فيه خطر يتوجهوا لمندوب تاني.",
  },
  {
    indicator: "info",
    label: "طلبيات مرتجعة",
    description:
      "نسبة المرتجع 11% من إجمالي الطلبيات، ضمن المعدل الطبيعي بس بتستاهل متابعة.",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "جدولة زيارة للزبائن الخمسة يلي ما تمت زيارتهم هالأسبوع.",
  "متابعة الطلبية المتأخرة مع الشركة لتسريع التسليم.",
  "التواصل مع الزبائن الجدد للتأكد من رضاهم عن أول طلبية.",
];

const INDICATOR_DOT: Record<string, string> = {
  error: "bg-red-500",
  warning: "bg-yellow-500",
  success: "bg-green-500",
  info: "bg-primary",
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

/* ============================================================
   Skeleton
   ============================================================ */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

/* ============================================================
   Drag scroll (helper محلي داخل نفس الملف)
   ============================================================ */

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

/* ============================================================
   KPI Row
   ============================================================ */

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

/* ============================================================
   Orders Distribution
   ============================================================ */

function OrdersDistributionSkeleton() {
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

function OrdersDistributionCard() {
  const [sel, setSel] = useState(0);
  const values = ORDERS_DISTRIBUTION.map((d) => d.value);
  const total = values.reduce((s, v) => s + v, 0);
  const maxV = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          توزيع الطلبيات
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
        <span className="text-xs text-muted-foreground">طلبية</span>
      </div>

      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {ORDERS_DISTRIBUTION.map((d, i) => {
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

/* ============================================================
   Insight Banner (rotating)
   ============================================================ */

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
    if (INSIGHT_BANNER.length < 2) return;
    const id = setInterval(
      () => setActive((p) => (p + 1) % INSIGHT_BANNER.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  const current = INSIGHT_BANNER[active];

  return (
    <div className="rounded-2xl bg-primary p-5 sm:p-6 text-primary-foreground relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
      <div className="flex items-center justify-between">
        <span className="text-base sm:text-lg font-medium">تنبيهات الأداء</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium">
          مباشر
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
          {INSIGHT_BANNER.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`تنبيه ${i + 1}`}
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

/* ============================================================
   ملخص أداء المندوب
   ============================================================ */

function RepInsightsSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-2 mb-6">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border space-y-2">
        <Skeleton className="h-3.5 w-36 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function RepInsights() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-lg sm:text-xl font-medium mb-4 text-foreground">
        ملخص أداء المندوب
      </h2>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {PERFORMANCE_SUMMARY}
      </p>

      <ul className="space-y-4">
        {PERFORMANCE_INSIGHTS.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                INDICATOR_DOT[insight.indicator]
              }`}
            />
            <div>
              <div className="font-semibold text-sm mb-1 text-foreground">
                {insight.label}
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed">
                {insight.description}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          شو لازم يعمل المندوب
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

/* ============================================================
   Activity Section
   ============================================================ */

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

/* ============================================================
   Page
   ============================================================ */

export default function RepOverview() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      dir="rtl"
      className="w-full bg-background min-h-screen p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:gap-6">
        <KpiRow loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {loading ? (
            <OrdersDistributionSkeleton />
          ) : (
            <OrdersDistributionCard />
          )}
          {loading ? <InsightBannerSkeleton /> : <InsightBanner />}
        </div>

        {loading ? <RepInsightsSkeleton /> : <RepInsights />}

        <ActivitySection loading={loading} />
      </div>
    </div>
  );
}
