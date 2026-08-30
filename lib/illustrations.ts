import type { StaticImageData } from "next/image";
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
  | "customers"
  | "products"
  | "orders"
  | "invoices"
  | "roles";

export interface EmptyStatePreset {
  image: string | StaticImageData;
  alt: string;
  title: string;
  description: string;
  actionLabel: string;
}

export const emptyStatePresets: Record<EmptyStateVariant, EmptyStatePreset> = {
  reps: {
    image: repsImg,
    alt: "بطاقة مندوب فارغة",
    title: "لم تضف أي مندوب بعد",
    description: "أضف مناديبك لتتمكن من متابعة زياراتهم وتوزيع الطلبات عليهم.",
    actionLabel: "إضافة مندوب",
  },
  // customers: {
  //   image: customersImg,
  //   alt: "دفتر زبائن فارغ",
  //   title: "قائمة الزبائن فارغة",
  //   description: "ابدأ بإضافة زبائنك لتتمكن من تسجيل طلباتهم وفواتيرهم.",
  //   actionLabel: "إضافة زبون",
  // },
  products: {
    image: productsImg,
    alt: "رفوف منتجات فارغة",
    title: "لا توجد منتجات في المستودع",
    description: "أضف منتجاتك وحدّد أسعارها وكمياتها لتبدأ البيع.",
    actionLabel: "إضافة منتج",
  },
  // orders: {
  //   image: ordersImg,
  //   alt: "قائمة طلبات فارغة",
  //   title: "لا توجد طلبات حتى الآن",
  //   description: "عندما يسجّل مناديبك أو زبائنك طلبًا جديدًا سيظهر هنا مباشرة.",
  //   actionLabel: "إنشاء طلب",
  // },
  invoices: {
    image: invoicesImg,
    alt: "فاتورة فارغة",
    title: "لا توجد فواتير بعد",
    description: "فواتير البيع التي يصدرها المناديب عند التسليم ستظهر هنا مع حالة التحصيل.",
    actionLabel: "إنشاء فاتورة",
  },
  // roles: {
  //   image: rolesImg,
  //   alt: "مستخدمون وصلاحيات",
  //   title: "لم تنشئ أي دور أو مستخدم",
  //   description: "أنشئ أدوارًا وحدّد صلاحياتها ثم ادعُ فريقك للانضمام.",
  //   actionLabel: "إضافة مستخدم",
  // },
};
