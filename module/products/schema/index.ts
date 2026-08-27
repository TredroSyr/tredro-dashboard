import { z } from "zod";

export const draftPriceSchema = z.object({
  _localId: z.string(),
  server_id: z.number().optional(), // renamed from `id`
  currency: z.number({ required_error: "العملة مطلوبة" }),
  currency_code: z.string().optional(),
  currency_symbol: z.string().optional(),
  price_type: z.string(),
  customer_category: z.number().nullable(),
  price: z.string().min(1, "السعر مطلوب"),
  is_default: z.boolean(),
});

export const draftImageSchema = z.object({
  _localId: z.string(),
  server_id: z.number().optional(), // renamed from `id`
  file: z.instanceof(File).optional(),
  url: z.string().optional(),
  previewUrl: z.string(),
  alt_text: z.string(),
  is_primary: z.boolean(),
});

export const productFormSchema = z
  .object({
    name: z.string().min(1, "اسم المنتج مطلوب"),
    description: z.string(),
    sku: z.string(),
    barcode: z.string(),
    brand: z.string(),
    category: z.number().optional(),
    unit: z.number({ required_error: "وحدة القياس مطلوبة" }),
    weight: z.string(),
    weight_unit: z.string(),
    length: z.string(),
    width: z.string(),
    height: z.string(),
    dimension_unit: z.string(),
    reorder_point: z.string(),
    reorder_quantity: z.string(),
    is_taxable: z.boolean(),
    tax_rate: z.string(),
    is_sellable: z.boolean(),
    is_purchasable: z.boolean(),
    external_reference: z.string(),
    notes: z.string(),
    is_active: z.boolean(),
    status: z.enum(["draft", "published"]),
    custom_fields: z.record(z.string(), z.string()),
    prices: z.array(draftPriceSchema).min(1, "يجب إضافة سعر واحد على الأقل"),
    images: z.array(draftImageSchema),
  })
  .superRefine((data, ctx) => {
    if (data.is_taxable && !data.tax_rate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "نسبة الضريبة مطلوبة عند تفعيل الضريبة",
        path: ["tax_rate"],
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type DraftPriceValue = z.infer<typeof draftPriceSchema>;
export type DraftImageValue = z.infer<typeof draftImageSchema>;
