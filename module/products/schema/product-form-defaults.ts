import { ProductFormValues } from ".";
import { ProductDetail } from "../types";

export const getProductFormDefaultValues = (
  product?: ProductDetail,
): ProductFormValues => ({
  name: product?.name ?? "",
  description: product?.description ?? "",
  sku: product?.sku ?? "",
  barcode: product?.barcode ?? "",
  brand: product?.brand ?? "",
  category: product?.category,
  unit: product?.unit as number,
  weight: product?.weight ?? "",
  weight_unit: product?.weight_unit ?? "",
  length: product?.length ?? "",
  width: product?.width ?? "",
  height: product?.height ?? "",
  dimension_unit: product?.dimension_unit ?? "",
  reorder_point: product?.reorder_point ?? "",
  reorder_quantity: product?.reorder_quantity ?? "",
  is_taxable: product?.is_taxable ?? false,
  tax_rate: product?.tax_rate ?? "",
  is_sellable: product?.is_sellable ?? true,
  is_purchasable: product?.is_purchasable ?? true,
  external_reference: product?.external_reference ?? "",
  notes: product?.notes ?? "",
  is_active: product?.is_active ?? true,
  status: product?.status ?? "draft",
  custom_fields: product?.custom_fields ?? {},
  prices:
    product?.prices?.map((p) => ({
      _localId: crypto.randomUUID(),
      id: p.id,
      currency: p.currency,
      currency_code: p.currency_code,
      currency_symbol: p.currency_symbol,
      price_type: p.price_type,
      customer_category: p.customer_category,
      price: p.price,
      is_default: p.is_default,
    })) ?? [],
  images:
    product?.images?.map((img) => ({
      _localId: crypto.randomUUID(),
      id: img.id,
      url: img.url,
      previewUrl: img.url,
      alt_text: img.alt_text ?? "",
      is_primary: img.is_primary,
    })) ?? [],
});
