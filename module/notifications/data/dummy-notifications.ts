import { NotificationItem } from "../types";

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

/** Placeholder feed until the backend notifications endpoint is wired up. */
export const dummyNotifications: NotificationItem[] = [
  {
    id: 1,
    kind: "order",
    title: "طلب جديد من عميل",
    body: "قام العميل \"محمد أحمد\" بإنشاء طلب جديد بقيمة 1,250 ج.م.",
    created_at: hoursAgo(1),
    is_read: false,
  },
  {
    id: 2,
    kind: "stock_transfer",
    title: "طلب تحويل مخزون",
    body: "المندوب \"سارة علي\" طلبت تحويل مخزون من مستودع الرئيسي.",
    created_at: hoursAgo(3),
    is_read: false,
  },
  {
    id: 3,
    kind: "invoice",
    title: "تم تحصيل فاتورة",
    body: "تم تحصيل الفاتورة رقم #10432 بالكامل.",
    created_at: hoursAgo(6),
    is_read: true,
  },
  {
    id: 4,
    kind: "order",
    title: "طلب بانتظار المراجعة",
    body: "لديك 3 طلبات جديدة بانتظار المراجعة والموافقة.",
    created_at: hoursAgo(20),
    is_read: true,
  },
  {
    id: 5,
    kind: "system",
    title: "تحديث النظام",
    body: "تمت إضافة ميزة الإشعارات الفورية إلى لوحة التحكم.",
    created_at: hoursAgo(48),
    is_read: true,
  },
];
