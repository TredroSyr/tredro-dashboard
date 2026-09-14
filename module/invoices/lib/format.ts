export {
  formatMoney,
  formatMoneyParts,
  formatMoneyPlain,
  formatDateShort,
} from "@/lib/format";

/** "مبيعات مباشرة" for a null rep — a company-direct sale, not missing data. */
export function formatRepName(repName: string | null | undefined) {
  return repName ?? "مبيعات مباشرة";
}

/** Formats a 3-decimal API quantity string ("10.000") for display, dropping trailing zeros. */
export function formatQuantity(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("ar", { maximumFractionDigits: 3 });
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** returned_quantity is null when nothing has been returned yet — treat as 0 (Frontend.md §3.3). */
export function num(value: string | number | null | undefined): number {
  return Number(value ?? 0) || 0;
}
