import type { CustomerRequestStatus } from "../types";

export const STATUS_LABEL: Record<CustomerRequestStatus, string> = {
  pending: "معلق",
  accepted: "مقبول",
  fulfilled: "مسلم",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export const STATUS_BADGE_VARIANT: Record<
  CustomerRequestStatus,
  "warning" | "default" | "success" | "destructive" | "secondary"
> = {
  pending: "warning",
  accepted: "default",
  fulfilled: "success",
  rejected: "destructive",
  cancelled: "secondary",
};

const UNIT_NAME_AR: Record<string, string> = {
  Package: "عبوة",
  Liter: "لتر",
  KG: "كيلوغرام",
  Piece: "قطعة",
  Box: "صندوق",
  Carton: "كرتونة",
  Bottle: "زجاجة",
  Bag: "كيس",
  Meter: "متر",
  Gram: "غرام",
  Dozen: "دزينة",
  Set: "طقم",
  Roll: "لفة",
  Can: "علبة",
};

export function translateUnitName(unitName: string): string {
  return UNIT_NAME_AR[unitName] ?? unitName;
}

export function formatRequestQuantity(value: string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("ar", { maximumFractionDigits: 3 });
}
