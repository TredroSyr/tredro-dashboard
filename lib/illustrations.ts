import type { StaticImageData } from "next/image";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import permissionImg from "@/public/illustration/permission-denied.png";
import repsImg from "@/public/illustration/empty-reps.png";
import productsImg from "@/public/illustration/empty-products.png";
import invoicesImg from "@/public/illustration/empty-invoices.png";
import notFoundImg from "@/public/illustration/404-robot.png";

export const stateImages = {
  permissionDenied: permissionImg,
  notFound: notFoundImg,
};

export type EmptyStateVariant =
  | "reps"
  | "products"
  | "invoices";

export interface EmptyStatePreset {
  icon: iconName;
  title: string;
  description: string;
  actionLabel: string;
}

export const emptyStatePresets: Record<EmptyStateVariant, EmptyStatePreset> = {
  reps: {
    icon: "users_outlined",
    title: "لم تضف أي مندوب بعد",
    description: "أضف مناديبك لتتمكن من متابعة زياراتهم وتوزيع الطلبات عليهم.",
    actionLabel: "إضافة مندوب",
  },
  products: {
    icon: "cart_outlined",
    title: "لا توجد منتجات في المستودع",
    description: "أضف منتجاتك وحدّد أسعارها وكمياتها لتبدأ البيع.",
    actionLabel: "إضافة منتج",
  },
  invoices: {
    icon: "sales_outlined",
    title: "لا توجد فواتير بعد",
    description: "فواتير البيع التي يصدرها المناديب عند التسليم ستظهر هنا مع حالة التحصيل.",
    actionLabel: "إنشاء فاتورة",
  },
};
