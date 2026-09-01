"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";

/* ============================================================
   Dummy Data — على مستوى المنصة كلها (بديل مؤقت لحد ما نربط الـ API)
   ============================================================ */

const KPIS: {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change?: number | null;
  icon: iconName;
}[] = [
  {
    key: "reps",
    label: "مناديب نشطين",
    value: 18,
    change: 6,
    icon: "users_outlined",
  },
  {
    key: "customers",
    label: "إجمالي الزبائن",
    value: 342,
    change: 9,
    icon: "contacts_outlined",
  },
  {
    key: "orders",
    label: "الطلبيات هالشهر",
    value: "1,240",
    change: 14,
    icon: "cart_outlined",
  },
  {
    key: "revenue",
    label: "إجمالي المبيعات",
    value: "86,400,000",
    suffix: "ل.س",
    change: 11,
    icon: "revenue_outlined",
  },
  {
    key: "invoices",
    label: "الفواتير (إدخال/مرتجع)",
    value: 96,
    change: -4,
    icon: "payment_outlined",
  },
  {
    key: "newCustomers",
    label: "زبائن جدد (إحالة)",
    value: 27,
    change: 22,
    icon: "add_user_outlined",
  },
];

const ORDERS_DISTRIBUTION = [
  { label: "مكتملة", value: 860 },
  { label: "قيد الانتظار", value: 220 },
  { label: "مرتجعة", value: 110 },
  { label: "ملغية", value: 50 },
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
        value: "86,400,000",
        suffix: "ل.س",
        change: 11,
        label: "إجمالي المبيعات",
        sub: "آخر 30 يوم",
      },
      { value: "1,240", change: 14, label: "عدد الطلبيات", sub: "آخر 30 يوم" },
      {
        value: 220,
        change: -6,
        label: "طلبيات معلّقة",
        sub: "بانتظار الموافقة",
      },
    ],
  },
  {
    key: "invoices",
    title: "الفواتير",
    icon: "payment_outlined",
    tiles: [
      { value: 74, change: 8, label: "فواتير إدخال", sub: "آخر 30 يوم" },
      { value: 22, change: -12, label: "فواتير مرتجع", sub: "آخر 30 يوم" },
    ],
  },
  {
    key: "customers",
    title: "الزبائن",
    icon: "contacts_outlined",
    tiles: [
      {
        value: 342,
        change: 9,
        label: "إجمالي الزبائن",
        sub: "على مستوى المنصة",
      },
      { value: 27, change: 22, label: "زبائن جدد", sub: "عبر كود الإحالة" },
    ],
  },
  {
    key: "reps",
    title: "المناديب",
    icon: "users_outlined",
    tiles: [
      { value: 18, change: 6, label: "مناديب نشطين", sub: "هالشهر" },
      { value: 3, change: 50, label: "مناديب جدد", sub: "هالشهر" },
    ],
  },
];

/** بانر فوق — توقعات وتنبؤات على مستوى المنصة (rotating) */
const FORECAST_BANNER: {
  indicator: "error" | "warning" | "success" | "info";
  label: string;
  description: string;
}[] = [
  {
    indicator: "success",
    label: "نمو متوقع بالمبيعات",
    description:
      "بمعدل النمو الحالي، متوقع تتجاوز المبيعات 95 مليون ل.س نهاية الشهر (+10%).",
  },
  {
    indicator: "warning",
    label: "مناديب أداءهم متراجع",
    description:
      "3 مناديب معدل زياراتهم انخفض أكثر من 20% هالأسبوع، بيحتاجوا متابعة.",
  },
  {
    indicator: "info",
    label: "تركّز المبيعات",
    description:
      "60% من مبيعات هالشهر جايي من 5 مناديب بس — فرصة لتوسيع التوزيع.",
  },
];

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

const ANALYSIS_INTRO =
  "بناءً على تحليل بيانات المنصة خلال الفترة الحالية، وبافتراض استمرار المعدلات ذاتها حتى نهاية الشهر:";

const PERFORMANCE_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: "up" | "down" | "steady";
}[] = [
  {
    metric: "المبيعات",
    current: "الوضع الحالي: 86.4 مليون ل.س منذ بداية الشهر",
    projected: "التوقع: نحو 95 مليون ل.س بحلول نهاية الشهر (+10%)",
    trend: "up",
  },
  {
    metric: "الطلبيات",
    current: "الوضع الحالي: 1,240 طلبية منذ بداية الشهر",
    projected: "التوقع: نحو 1,410 طلبية بحلول نهاية الشهر (+14%)",
    trend: "up",
  },
  {
    metric: "المناديب الأقل نشاطاً",
    current: "الوضع الحالي: انخفض معدل زيارات 3 مناديب هذا الأسبوع",
    projected: "التوقع: مخاطرة بتراجع مبيعاتهم بنسبة 15-20% إذا استمر الوضع",
    trend: "down",
  },
  {
    metric: "المرتجعات",
    current: "الوضع الحالي: 8.9% من إجمالي الطلبيات مرتجعة",
    projected: "التوقع: يُتوقع أن تبقى ضمن المعدل الطبيعي (8-10%)",
    trend: "steady",
  },
];

const PERFORMANCE_RECOMMENDATIONS = [
  "متابعة المناديب الثلاثة الذين تراجع نشاطهم، قبل أن ينعكس ذلك سلباً على المبيعات.",
  "تشجيع بقية المناديب لتقليل الاعتماد على خمسة مناديب فقط في تحقيق المبيعات.",
  "مراقبة نسبة المرتجعات أسبوعياً لتبقى ضمن الحد الطبيعي.",
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

/** أفضل المناديب أداءً (Leaderboard) */
const TOP_REPS: {
  name: string;
  type: string;
  sales: string;
  orders: number;
  change: number;
}[] = [
  {
    name: "محمد الأحمد",
    type: "مفرّق",
    sales: "18,450,000",
    orders: 128,
    change: 12,
  },
  {
    name: "خالد يوسف",
    type: "جملة",
    sales: "15,200,000",
    orders: 96,
    change: 8,
  },
  {
    name: "سامر عيسى",
    type: "مفرّق",
    sales: "12,900,000",
    orders: 84,
    change: -3,
  },
  {
    name: "رامي حداد",
    type: "مفرّق",
    sales: "10,600,000",
    orders: 71,
    change: 5,
  },
  {
    name: "وائل شحادة",
    type: "جملة",
    sales: "9,100,000",
    orders: 63,
    change: 15,
  },
];

/** الأكثر مبيعاً من المنتجات */
const TOP_PRODUCTS: {
  name: string;
  unitsSold: number;
  revenue: string;
  change: number;
}[] = [
  {
    name: "زيت دوار الشمس 1 لتر",
    unitsSold: 2140,
    revenue: "21,400,000",
    change: 9,
  },
  { name: "سكر أبيض 1 كغ", unitsSold: 1890, revenue: "15,120,000", change: 4 },
  { name: "أرز مصري 1 كغ", unitsSold: 1520, revenue: "12,160,000", change: -2 },
  {
    name: "معلبات طماطم 400 غ",
    unitsSold: 1310,
    revenue: "6,550,000",
    change: 18,
  },
  { name: "شاي أحمر 100 كيس", unitsSold: 980, revenue: "9,800,000", change: 6 },
];

/* ============================================================
   Skeleton
   ============================================================ */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

/* ============================================================
   Drag scroll
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
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-20 mt-3" />
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
          توزيع الطلبيات — كل المنصة
        </span>
        <IconRenderer
          name="arrow_up_right_outlined"
          className="size-4 text-muted-foreground"
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {total.toLocaleString("ar")}
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
   Forecast Banner (rotating)
   ============================================================ */

function ForecastBannerSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 h-full min-h-[220px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3.5 w-32" />
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

function ForecastBanner() {
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

/* ============================================================
   نظرة عامة على الأداء والتوقعات
   ============================================================ */

function AnalysisSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-5 w-52" />
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
        <Skeleton className="h-3.5 w-52 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function AnalysisSection() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name="ai_outlined" className="size-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-foreground">
          نظرة عامة على الأداء والتوقعات
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
          الخطوات الموصى بها بناءً على هذه التوقعات
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
   أفضل المناديب (Leaderboard)
   ============================================================ */

const RANK_STYLE = [
  "bg-amber-500/15 text-amber-600",
  "bg-slate-400/15 text-slate-500",
  "bg-orange-500/15 text-orange-600",
];

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

function TopRepsSection() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-medium text-foreground">
          أفضل المناديب أداءً
        </h2>
        <span className="text-xs text-muted-foreground">هالشهر</span>
      </div>
      <ul className="space-y-1">
        {TOP_REPS.map((rep, i) => {
          const isUp = rep.change >= 0;
          return (
            <li
              key={rep.name}
              className="flex items-center gap-3 py-2 rounded-xl hover:bg-muted/40 px-1.5"
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
                  {rep.type} · {rep.orders} طلبية
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-sm font-semibold text-foreground">
                  {rep.sales}
                </div>
                <div
                  className={`text-[11px] flex items-center justify-end gap-0.5 ${
                    isUp ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  <IconRenderer
                    name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                    className="size-2.5"
                  />
                  {Math.abs(rep.change)}%
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================================================
   الأكثر مبيعاً من المنتجات
   ============================================================ */

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

function TopProductsSection() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-medium text-foreground">
          الأكثر مبيعاً من المنتجات
        </h2>
        <span className="text-xs text-muted-foreground">هالشهر</span>
      </div>
      <ul className="space-y-1">
        {TOP_PRODUCTS.map((product) => {
          const isUp = product.change >= 0;
          return (
            <li
              key={product.name}
              className="flex items-center gap-3 py-2 rounded-xl hover:bg-muted/40 px-1.5"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconRenderer name="category_outlined" className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {product.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {product.unitsSold.toLocaleString("ar")} قطعة مباعة
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-sm font-semibold text-foreground">
                  {product.revenue}
                </div>
                <div
                  className={`text-[11px] flex items-center justify-end gap-0.5 ${
                    isUp ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  <IconRenderer
                    name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                    className="size-2.5"
                  />
                  {Math.abs(product.change)}%
                </div>
              </div>
            </li>
          );
        })}
      </ul>
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

export default function PlatformOverview() {
  return (
    <div>
      <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            نظرة عامة على المنصة
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            ملخص شامل للمناديب، الزبائن، الطلبيات، الفواتير والمنتجات
          </p>
        </div>

        <KpiRow />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <OrdersDistributionCard />
          <ForecastBanner />
        </div>

        <AnalysisSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <TopRepsSection />
          <TopProductsSection />
        </div>

        <ActivitySection />
      </div>
    </div>
  );
}
