/** Formats an API decimal string ("1690.00") as an Arabic-locale number with a currency suffix. */
export function formatMoney(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  const formatted = n.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ل.س`;
}

/** Same as formatMoney but without the currency suffix, for compact contexts. */
export function formatMoneyPlain(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** returned_quantity is null when nothing has been returned yet — treat as 0 (Frontend.md §3.3). */
export function num(value: string | number | null | undefined): number {
  return Number(value ?? 0) || 0;
}
