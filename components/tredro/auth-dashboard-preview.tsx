"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { Button } from "@/components/ui/button";

type Variant = "login" | "register";

type TabKey = "overview" | "reps" | "invoices" | "permissions" | "analysis";

const TAB_LABELS: Record<TabKey, string> = {
  overview: "نظرة عامة",
  reps: "المناديب",
  invoices: "الفواتير",
  permissions: "الصلاحيات",
  analysis: "التحليل",
};

const TAB_ORDER: Record<Variant, TabKey[]> = {
  login: ["reps", "permissions"],
  register: ["invoices", "overview"],
};

const AUTO_ROTATE_MS = 4500;

const KPIS: {
  key: string;
  label: string;
  value: string;
  suffix?: string;
  change: number;
  icon: iconName;
}[] = [
  {
    key: "reps",
    label: "مناديب نشطون",
    value: "18",
    change: 6,
    icon: "users_outlined",
  },
  {
    key: "customers",
    label: "إجمالي الزبائن",
    value: "342",
    change: 9,
    icon: "contacts_outlined",
  },
  {
    key: "orders",
    label: "الطلبيات هذا الشهر",
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
];

const RANK_STYLE = [
  "bg-amber-500/15 text-amber-600",
  "bg-slate-400/15 text-slate-500",
  "bg-orange-500/15 text-orange-600",
];

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
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-primary/70 mb-3">{children}</p>
  );
}

function OverviewTab({ variant }: { variant: Variant }) {
  return (
    <div className="space-y-3">
      <Eyebrow>
        {variant === "login"
          ? "بيانات شركتك اليوم"
          : "هكذا ستبدو لوحتك بعد التسجيل"}
      </Eyebrow>

      <div className="grid grid-cols-2 gap-3">
        {KPIS.map((item, i) => {
          const isUp = item.change >= 0;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.05 * i }}
              className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <IconRenderer name={item.icon} className="size-3.5" />
                </div>
                <span
                  className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    isUp ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  <IconRenderer
                    name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                    className="size-2.5"
                  />
                  {Math.abs(item.change)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-lg font-semibold text-foreground truncate">
                  {item.value}
                </span>
                {item.suffix && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.suffix}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TopRepsTab({ variant }: { variant: Variant }) {
  const reps = variant === "login" ? TOP_REPS : TOP_REPS.slice(0, 3);

  return (
    <div>
      <Eyebrow>
        {variant === "login"
          ? "أداء الفريق خلال هذا الشهر"
          : "تابع أداء مناديبك فور انضمامك"}
      </Eyebrow>

      <div className="rounded-xl border border-border bg-card p-3 space-y-1">
        {reps.map((rep, i) => {
          const isUp = rep.change >= 0;
          return (
            <motion.div
              key={rep.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 * i }}
              className="flex items-center gap-3 py-2 px-1.5 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
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
                <div className="text-xs font-semibold text-foreground">
                  {rep.sales}
                </div>
                <div
                  className={`text-[10px] flex items-center justify-end gap-0.5 ${
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
            </motion.div>
          );
        })}
        {variant === "register" && (
          <div className="text-center pt-1 text-[11px] text-muted-foreground">
            و+15 مندوباً فعّالاً على المنصة
          </div>
        )}
      </div>
    </div>
  );
}

const INVOICE_ACTIVITY = [
  { value: 74, change: 8, label: "فواتير إدخال", sub: "آخر 30 يوماً" },
  { value: 22, change: -12, label: "فواتير مرتجع", sub: "آخر 30 يوماً" },
];

const INVOICE_TYPES: { icon: iconName; title: string; desc: string }[] = [
  {
    icon: "sales_outlined",
    title: "فواتير مبيعات",
    desc: "سجّل مبيعات المناديب وتابع تحصيل الدفعات أولاً بأول",
  },
  {
    icon: "download_outlined",
    title: "فواتير إدخال",
    desc: "وثّق البضائع الداخلة من الموردين إلى مستودعاتك",
  },
  {
    icon: "undo_outlined",
    title: "فواتير مرتجع",
    desc: "سجّل مرتجعات الزبائن واسترجاع البضاعة بسهولة",
  },
];

function InvoicesTab({ variant }: { variant: Variant }) {
  if (variant === "register") {
    return (
      <div>
        <Eyebrow>جميع أنواع فواتيرك في مكان واحد</Eyebrow>
        <div className="space-y-2.5">
          {INVOICE_TYPES.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 * i }}
              className="flex items-start gap-3 rounded-xl bg-primary/4/50 p-3.5 hover:bg-primary/4 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <IconRenderer name={t.icon} className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
            <IconRenderer
              name="warning_outlined"
              className="w-4 h-4 text-amber-500 shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              تنبيه تلقائي عند تأخر سداد الفواتير
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Eyebrow>أحدث الحركات على الفواتير</Eyebrow>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {INVOICE_ACTIVITY.map((tile, i) => {
          const isUp = tile.change >= 0;
          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.06 * i }}
              className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-semibold text-foreground">
                  {tile.value}
                </span>
                <IconRenderer
                  name={isUp ? "arrow_up_outlined" : "arrow_down_outlined"}
                  className={`size-3 ${
                    isUp ? "text-emerald-600" : "text-red-500"
                  }`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {tile.label}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {tile.sub}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconRenderer name="payment_outlined" className="size-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            فاتورة مبيعات #A-1042
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            أحمد سالم · 2,450,000 ل.س
          </span>
          <span className="rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-medium px-2 py-0.5">
            مدفوعة جزئياً
          </span>
        </div>
      </div>
    </div>
  );
}

const TEAM_ACCESS = [
  { name: "سارة خالد", role: "محاسبة", view: 4, action: 2 },
  { name: "عمر الحلبي", role: "مشرف مبيعات", view: 6, action: 5 },
  { name: "دينا فارس", role: "مسؤولة مخزون", view: 3, action: 3 },
];

const PERMISSION_MODULES: { icon: iconName; label: string }[] = [
  { icon: "contacts_outlined", label: "العملاء" },
  { icon: "payment_outlined", label: "الفواتير" },
  { icon: "cart_outlined", label: "الطلبيات" },
  { icon: "category_outlined", label: "المنتجات" },
  { icon: "users_outlined", label: "المناديب" },
  { icon: "bundle_outlined", label: "المستودعات" },
];

function PermissionsTab({ variant }: { variant: Variant }) {
  if (variant === "register") {
    return (
      <div>
        <Eyebrow>حدد من يمكنه العرض ومن يمكنه التصرف</Eyebrow>
        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
          {PERMISSION_MODULES.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * i }}
              className="flex items-center gap-3 py-2 px-1.5 rounded-lg"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconRenderer name={m.icon} className="size-3.5" />
              </div>
              <span className="text-sm text-foreground flex-1">{m.label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <IconRenderer
                    name="eye_visible_outlined"
                    className="size-3"
                  />
                </span>
                <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <IconRenderer name="edit_outlined" className="size-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Eyebrow>صلاحيات فريقك الحالية</Eyebrow>
      <div className="rounded-xl border border-border bg-card p-3 space-y-1">
        {TEAM_ACCESS.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 * i }}
            className="flex items-center gap-3 py-2 px-1.5 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <IconRenderer
                name="user_outlined"
                className="w-4 h-4 text-primary"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">
                {member.name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {member.role}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 flex items-center gap-1">
                <IconRenderer
                  name="eye_visible_outlined"
                  className="size-2.5"
                />
                {member.view}
              </span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium px-2 py-0.5 flex items-center gap-1">
                <IconRenderer name="edit_outlined" className="size-2.5" />
                {member.action}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

type Trend = "up" | "down" | "steady";

const TREND_ICON: Record<Trend, iconName> = {
  up: "arrow_up_outlined",
  down: "arrow_down_outlined",
  steady: "minus_outlined",
};

const TREND_CLASS: Record<Trend, string> = {
  up: "text-emerald-600 bg-emerald-500/10",
  down: "text-red-500 bg-red-500/10",
  steady: "text-muted-foreground bg-muted",
};

const PLATFORM_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: Trend;
}[] = [
  {
    metric: "المبيعات",
    current: "86.4 مليون ل.س منذ بداية الشهر",
    projected: "≈ 95 مليون ل.س بنهاية الشهر (+10%)",
    trend: "up",
  },
  {
    metric: "الطلبيات",
    current: "1,240 طلبية منذ بداية الشهر",
    projected: "≈ 1,410 طلبية بنهاية الشهر (+14%)",
    trend: "up",
  },
  {
    metric: "المرتجعات",
    current: "8.9% من إجمالي الطلبيات",
    projected: "تبقى ضمن المعدل الطبيعي (8-10%)",
    trend: "steady",
  },
];

const PLATFORM_RECOMMENDATIONS = [
  "متابعة المناديب الذين تراجع نشاطهم قبل أن ينعكس ذلك على المبيعات.",
  "مراقبة نسبة المرتجعات أسبوعياً لتبقى ضمن الحد الطبيعي.",
];

const PRODUCT_PROJECTIONS: {
  metric: string;
  current: string;
  projected: string;
  trend: Trend;
}[] = [
  {
    metric: "زيت دوار الشمس 1 لتر",
    current: "2,140 قطعة مباعة هذا الشهر",
    projected: "نمو متوقع بنسبة 9% خلال الشهر القادم",
    trend: "up",
  },
  {
    metric: "معلبات طماطم 400 غ",
    current: "1,310 قطعة مباعة هذا الشهر",
    projected: "نمو متوقع بنسبة 18% خلال الشهر القادم",
    trend: "up",
  },
  {
    metric: "أرز مصري 1 كغ",
    current: "1,520 قطعة مباعة هذا الشهر",
    projected: "تراجع متوقع بنسبة 2%، ويحتاج إلى متابعة",
    trend: "down",
  },
];

const PRODUCT_RECOMMENDATIONS = [
  "ركّز على ترويج المنتجات الأسرع نمواً مثل معلبات الطماطم.",
  "راقب المنتجات المتراجعة مثل الأرز المصري قبل أن يتراجع المخزون.",
];

function AnalysisTab({ variant }: { variant: Variant }) {
  const isLogin = variant === "login";
  const title = isLogin
    ? "تحليل الأداء والتوقعات — كل المنصة"
    : "تحليل أداء المنتج والتوقعات";
  const intro = isLogin
    ? "بناءً على تحليل بيانات المنصة، وبافتراض استمرار المعدلات الحالية حتى نهاية الشهر:"
    : "توقعات ذكية لأداء منتجاتك، مبنية على بيانات مماثلة من المنصة:";
  const projections = isLogin ? PLATFORM_PROJECTIONS : PRODUCT_PROJECTIONS;
  const recommendations = isLogin
    ? PLATFORM_RECOMMENDATIONS
    : PRODUCT_RECOMMENDATIONS;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconRenderer name="ai_outlined" className="size-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground leading-tight">
          {title}
        </h3>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        {intro}
      </p>

      <ul className="space-y-2 mb-4">
        {projections.map((p, i) => (
          <motion.li
            key={p.metric}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.06 * i }}
            className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3"
          >
            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                TREND_CLASS[p.trend]
              }`}
            >
              <IconRenderer name={TREND_ICON[p.trend]} className="size-3" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground mb-0.5">
                {p.metric}
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                {p.current}
              </div>
              <div className="text-[11px] text-foreground leading-relaxed">
                {p.projected}
              </div>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="pt-3 border-t border-border space-y-1.5">
        {recommendations.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <IconRenderer
              name="tick_filled"
              className="size-3 text-primary shrink-0 mt-0.5"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              {r}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MASCOT_WIDTH = 300;
const MASCOT_HEIGHT = 184;
const MASCOT_FRAME_DIP = 46;

const TAB_CONTENT_HEIGHT = 340;

export default function AuthDashboardPreview({
  variant,
}: {
  variant: Variant;
}) {
  const order = TAB_ORDER[variant];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setIndex((prev) => (prev + 1) % order.length);
    }, AUTO_ROTATE_MS);
    return () => clearTimeout(id);
  }, [index, order.length]);

  useEffect(() => {
    setIndex(0);
  }, [order.length, variant]);

  const activeKey = order[index];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative"
    >
      <div className="relative rounded-2xl border border-border overflow-visible bg-card">
        {/* <div
          aria-hidden
          style={{
            width: MASCOT_WIDTH,
            height: MASCOT_HEIGHT,
            top: -(MASCOT_HEIGHT - MASCOT_FRAME_DIP),
          }}
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none z-20 "
        >
          <Image
            src="/tredro/mascot-lying.png"
            alt="مساعد Tredro"
            width={MASCOT_WIDTH}
            height={MASCOT_HEIGHT}
            sizes={`${MASCOT_WIDTH}px`}
            className="absolute top-0 left-12 w-full h-full object-contain object-top drop-shadow-lg"
          />
        </div> */}

        <div className="relative  py-2">
          <div className="relative flex flex-wrap justify-center gap-1 rounded-full p-1 bg-primary/4 mx-auto w-fit">
            {order.map((key, i) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setIndex(i)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  i === index
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TAB_LABELS[key]}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-3">
          {order.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={TAB_LABELS[key]}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/20"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ height: TAB_CONTENT_HEIGHT }}
            className="px-6 pb-6 w-full overflow-hidden"
          >
            {activeKey === "overview" && <OverviewTab variant={variant} />}
            {activeKey === "reps" && <TopRepsTab variant={variant} />}
            {activeKey === "invoices" && <InvoicesTab variant={variant} />}
            {activeKey === "permissions" && (
              <PermissionsTab variant={variant} />
            )}
            {activeKey === "analysis" && <AnalysisTab variant={variant} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
