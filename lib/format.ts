/** ISO 4217 code → the label shown after an amount. */
const CURRENCY_LABEL: Record<string, string> = {
  SYP: "ل.س",
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  SAR: "ر.س",
};

/**
 * Formats an API decimal string ("1690.00") as an Arabic-locale number with a
 * currency label. Pass the owning record's own `currency` — money is pinned
 * per document/overview response, not read from company settings.
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency?: string,
) {
  const n = Number(value ?? 0);
  const formatted = n.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const label = currency ? (CURRENCY_LABEL[currency] ?? currency) : "ل.س";
  return `${formatted} ${label}`;
}

/** Same as formatMoney but with the amount and currency label as separate strings, for mixed styling. */
export function formatMoneyParts(
  value: string | number | null | undefined,
  currency?: string,
) {
  const n = Number(value ?? 0);
  const amount = n.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const label = currency ? (CURRENCY_LABEL[currency] ?? currency) : "ل.س";
  return { amount, label };
}

/** Same as formatMoney but without the currency suffix, for compact contexts. */
export function formatMoneyPlain(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Compact "15 أغسطس" form for a date range subtitle — no year, no time. */
export function formatDateShort(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-SY", {
    day: "numeric",
    month: "short",
    numberingSystem: "latn",
  });
}
