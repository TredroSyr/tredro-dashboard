export type Stat = {
  key: string;
  label: string;
  value: string;
  trend: "up" | "down";
  delta: string;
};

export const stats: Stat[] = [
  {
    key: "satisfaction",
    label: "رضا الزبائن",
    value: "٩٤٪",
    trend: "up",
    delta: "٣.٢٪",
  },
  {
    key: "avg-time",
    label: "متوسط وقت التوصيل",
    value: "٢٨ د",
    trend: "down",
    delta: "١.٥٪",
  },
  {
    key: "active-reps",
    label: "المناديب النشطون",
    value: "٤٦",
    trend: "up",
    delta: "٥.٨٪",
  },
];

export type Order = {
  id: string;
  icon: "truck" | "store" | "receipt";
  title: string;
  status: string;
  amount: string;
  tone: "warning" | "info" | "success";
};

export const orders: Order[] = [
  {
    id: "ord-1042",
    icon: "truck",
    title: "طلب #١٠٤٢ - سوبرماركت الأمانة",
    status: "قيد التوصيل",
    amount: "٤٥ د إضافية",
    tone: "warning",
  },
  {
    id: "ord-1041",
    icon: "store",
    title: "طلب #١٠٤١ - بقالة النور",
    status: "بانتظار التأكيد",
    amount: "١٢ د",
    tone: "info",
  },
  {
    id: "ord-1039",
    icon: "receipt",
    title: "طلب #١٠٣٩ - محلات الفردوس",
    status: "تم الإنجاز",
    amount: "٠ د",
    tone: "success",
  },
  {
    id: "ord-1035",
    icon: "truck",
    title: "طلب #١٠٣٥ - سوبرماركت الرحمة",
    status: "قيد التوصيل",
    amount: "٢٠ د",
    tone: "warning",
  },
];

export type ActivityItem = {
  id: string;
  avatar: string;
  name: string;
  time: string;
  action: string;
  target: string;
  message?: string;
  file?: { name: string; size: string };
};

export const activity: ActivityItem[] = [
  {
    id: "act-1",
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "سامر خليل",
    time: "قبل ٥ د",
    action: "أنجز طلب في",
    target: "سوبرماركت الأمانة",
    message: "تم تسليم الطلب والدفع كامل، بانتظار الطلب التالي.",
  },
  {
    id: "act-2",
    avatar: "https://i.pravatar.cc/150?img=32",
    name: "ريم عودة",
    time: "قبل ٢٢ د",
    action: "رفعت فاتورة في",
    target: "بقالة النور",
    file: { name: "فاتورة-١٠٤١.pdf", size: "٢٤٠ كيلوبايت" },
  },
  {
    id: "act-3",
    avatar: "https://i.pravatar.cc/150?img=45",
    name: "وسيم فارس",
    time: "قبل ساعة",
    action: "أضاف ملاحظة على",
    target: "محلات الفردوس",
    message: "الزبون طلب تأجيل التسليم ليوم غد صباحاً.",
  },
];

export const repProfile = {
  avatar: "https://i.pravatar.cc/150?img=8",
  name: "مروان العلي",
  username: "@marwan.ali",
};

export type PerformancePoint = {
  day: string;
  current: number;
  previous: number;
};

export const performance: PerformancePoint[] = [
  { day: "السبت", current: 4, previous: 3 },
  { day: "الأحد", current: 6, previous: 4 },
  { day: "الإثنين", current: 5, previous: 6 },
  { day: "الثلاثاء", current: 8, previous: 5 },
  { day: "الأربعاء", current: 7, previous: 7 },
  { day: "الخميس", current: 10, previous: 6 },
  { day: "الجمعة", current: 9, previous: 8 },
];
