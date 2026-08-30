import type { ProductDetail, ProductPrice } from "@/module/products/types";

/** The subset of a product's pricing data the currency guard needs. */
export type PricedProduct = Pick<ProductDetail, "prices"> & {
  default_price?: ProductDetail["default_price"];
};

export type ResolvedPrice = Pick<
  ProductPrice,
  "price" | "currency_code" | "currency_symbol" | "price_type"
>;

export type AddProductResult =
  | { ok: true; price: ResolvedPrice }
  | { ok: false; reason: "currency_mismatch" };

/**
 * Resolves an invoice's locked currency from its current lines. An invoice
 * with no priced lines yet has no lock — the first line's currency sets it.
 */
export function getInvoiceCurrency(
  lineCurrencies: Array<string | null | undefined>,
): string | null {
  return lineCurrencies.find((c): c is string => Boolean(c)) ?? null;
}

/**
 * Checks whether `product` can be added to an invoice already locked to
 * `invoiceCurrencyCode` (pass null when the invoice has no lines yet, i.e.
 * this would be the first line — always allowed).
 *
 * A product can carry prices in more than one currency; this only blocks the
 * add when NONE of the product's prices match the invoice's currency.
 */
export function canAddProductToInvoice(
  product: PricedProduct,
  invoiceCurrencyCode: string | null,
): AddProductResult {
  const prices = product.prices ?? [];

  if (!invoiceCurrencyCode) {
    const price = prices.find((p) => p.is_default) ?? prices[0] ?? product.default_price;
    return price ? { ok: true, price } : { ok: false, reason: "currency_mismatch" };
  }

  const match =
    prices.find((p) => p.currency_code === invoiceCurrencyCode && p.is_default) ??
    prices.find((p) => p.currency_code === invoiceCurrencyCode);
  if (match) return { ok: true, price: match };

  if (product.default_price?.currency_code === invoiceCurrencyCode) {
    return { ok: true, price: product.default_price };
  }

  return { ok: false, reason: "currency_mismatch" };
}

/**
 * Among a product's prices that share `currencyCode`, prefers the customer's
 * category price over the plain default one — used once
 * {@link canAddProductToInvoice} has already cleared the currency gate.
 */
export function pickPriceForCurrency(
  product: PricedProduct,
  currencyCode: string,
  customerCategoryId: number | null,
): ResolvedPrice | undefined {
  const candidates = (product.prices ?? []).filter(
    (p) => p.currency_code === currencyCode,
  );
  const categoryPrice = customerCategoryId
    ? candidates.find((p) => p.customer_category === customerCategoryId)
    : undefined;
  return (
    categoryPrice ??
    candidates.find((p) => p.is_default) ??
    candidates[0] ??
    (product.default_price?.currency_code === currencyCode
      ? product.default_price
      : undefined)
  );
}

/** Human-readable warning shown when a product's price doesn't match the invoice's locked currency. */
export function currencyMismatchMessage(invoiceCurrencyCode: string): string {
  return `لا يمكن إضافة أصناف بعملات مختلفة إلى نفس الفاتورة. هذه الفاتورة بعملة ${invoiceCurrencyCode} — اختر صنفاً له سعر بعملة ${invoiceCurrencyCode}، أو أنشئ فاتورة جديدة لهذه العملة.`;
}
