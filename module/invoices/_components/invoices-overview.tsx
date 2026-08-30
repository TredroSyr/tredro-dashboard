"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";

const KPIS: {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  change?: number | null;
  icon: iconName;
}[] = [
  {
    key: "invoiceCount",
    label: "فواتير البيع هالشهر",
    value: 128,
    change: 9,
    icon: "sales_outlined",
  },
  {
    key: "totalSales",
    label: "إجمالي المبيعات",
    value: "8,450,000",
    suffix: "ل.س",
    change: 6,
    icon: "revenue_outlined",
  },
  {
    key: "collected",
    label: "المحصّل هالشهر",
    value: "6,120,000",
    suffix: "ل.س",
    change: 11,
    icon: "transaction_outlined",
  },
  {
    key: "overdue",
    label: "ديون متأخرة",
    value: "940,000",
    suffix: "ل.س",
    change: -4,
    icon: "warning_outlined",
  },
  {
    key: "avgInvoice",
    label: "متوسط قيمة الفاتورة",
    value: "66,000",
    suffix: "ل.س",
    change: 3,
    icon: "price_outlined",
  },
  {
    key: "returnRate",
    label: "نسبة المرتجعات",
    value: "2.1%",
    change: -1,
    icon: "undo_outlined",
  },
];

const STATUS_DISTRIBUTION = [
  { label: "مدفوعة بالكامل", value: 72 },
  { label: "مدفوعة جزئياً", value: 31 },
  { label: "آجلة", value: 18 },
  { label: "متأخرة", value: 7 },
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
    icon: "sales_outlined",
    tiles: [
      {
        value: "8,450,000",
        suffix: "ل.س",
        change: 6,
        label: "إجمالي المبيعات",
        sub: "آخر 30 يوم",
      },
      { value: 128, change: 9, label: "عدد الفواتير", sub: "آخر 30 يوم" },
      {
        value: "66,000",
        suffix: "ل.س",
        change: 3,
        label: "متوسط الفاتورة",
        sub: "آخر 30 يوم",
      },
    ],
  },
  {
    key: "collections",
    title: "التحصيل",
    icon: "transaction_outlined",
    tiles: [
      {
        value: "5,640,000",
        suffix: "ل.س",
        change: 10,
        label: "محصّل نقداً",
        sub: "آخر 30 يوم",
      },
      {
        value: "480,000",
        suffix: "ل.س",
        change: 14,
        label: "محصّل من رصيد دائن",
        sub: "آخر 30 يوم",
      },
    ],
  },
  {
    key: "debts",
    title: "الديون",
    icon: "report_outlined",
    tiles: [
      {
        value: "940,000",
        suffix: "ل.س",
        change: -4,
        label: "ديون متأخرة",
        sub: "أكثر من 7 أيام",
      },
      { value: 14, change: -2, label: "فواتير متأخرة", sub: "بحاجة متابعة" },
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
    el.scrollLeft = state.current.startLeft - (e.clientX - state.current.startX);
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
      <span className="text-xs text-muted-foreground truncate">{item.label}</span>
    </div>
  );
}

function KpiRow() {
  const drag = useDragScroll();
  return (
    <div
      ref={drag.ref}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
      className={`flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible ${
        drag.dragging ? "cursor-grabbing select-none" : "cursor-grab sm:cursor-auto"
      }`}
    >
      {KPIS.map((item) => (
        <KpiCard key={item.key} item={item} />
      ))}
    </div>
  );
}

function StatusDistributionCard() {
  const [sel, setSel] = useState(0);
  const values = STATUS_DISTRIBUTION.map((d) => d.value);
  const total = values.reduce((s, v) => s + v, 0);
  const maxV = Math.max(...values, 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          توزيع حالات الفواتير
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
        <span className="text-xs text-muted-foreground">فاتورة</span>
      </div>

      <div className="mt-6 flex-1 flex items-end gap-2 sm:gap-4">
        {STATUS_DISTRIBUTION.map((d, i) => {
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
          <span className="text-[11px] text-muted-foreground">{tile.suffix}</span>
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

function ActivitySection() {
  const drag = useDragScroll();

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
                <IconRenderer name={group.icon} className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
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

export function InvoicesOverview() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6">
      <KpiRow />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <StatusDistributionCard />
        <InsightBanner />
      </div>

      <InvoiceInsights />

      <ActivitySection />
    </div>
  );
}
