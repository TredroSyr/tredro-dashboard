// Shared helpers for the profile PDF exports (rep + customer).
import { formatDateShort } from "@/lib/format";
import type { PdfIconName } from "./pdf-icons";

/**
 * `toLocaleString("ar", ...)` (used elsewhere for money) emits Arabic-Indic digits and
 * separators (٠-٩، ٬، ٫) that the embedded Thmanyah PDF font subset doesn't cover, so amounts
 * render as boxes. Force plain Latin digits for anything shown inside the PDF, same reasoning
 * as `formatDateShort`'s `numberingSystem: "latn"`.
 */
export function formatPdfAmount(value: number | string | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Tables show the latest rows only, so the PDF stays a profile and not a full ledger. */
export const PDF_TABLE_ROW_LIMIT = 50;

export interface PdfBadgeColor {
  bg: string;
  text: string;
}

export const PDF_BADGE_COLORS: Record<
  "default" | "success" | "warning" | "destructive" | "secondary",
  PdfBadgeColor
> = {
  default: { bg: "#DBEAFE", text: "#2563EB" },
  success: { bg: "#DCFCE7", text: "#16A34A" },
  warning: { bg: "#FFEDD5", text: "#F97316" },
  destructive: { bg: "#FEE2E2", text: "#DC2626" },
  secondary: { bg: "#F3F4F6", text: "#6B7280" },
};

export interface PdfKpi {
  key: string;
  icon: PdfIconName;
  label: string;
  value: string;
  suffix?: string;
  /** Internal PDF anchor id (without "#") to jump to when this KPI card is clicked. */
  linkTo?: string;
}

/** A table's rows plus how many exist in total, so the PDF can say when it is showing only the latest. */
export interface PdfTableData<T> {
  rows: T[];
  total: number;
}

export const toISODate = (value: string) => value.slice(0, 10);

/** "٢١ أغسطس - ٢٠ سبتمبر" style range for the period the overview cards cover. */
export function buildPeriodLabel(period: { date_from: string; date_to: string }): string {
  return `${formatDateShort(period.date_from)} - ${formatDateShort(period.date_to)}`;
}
