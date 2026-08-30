import { z } from "zod";

const quantityString = z
  .string()
  .min(1, "الكمية مطلوبة")
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), "أدخل كمية صحيحة")
  .refine((v) => Number(v) > 0, "يجب أن تكون الكمية أكبر من صفر");

// ---- Dispatch goods to a rep (admin-initiated, frontend4.md §6d) ----
export const dispatchStockTransferLineSchema = z.object({
  product_id: z.string().min(1, "اختر منتجاً"),
  quantity: quantityString,
});

export const dispatchStockTransferSchema = z.object({
  rep: z.string().min(1, "اختر مندوباً"),
  notes: z.string().optional(),
  lines: z
    .array(dispatchStockTransferLineSchema)
    .min(1, "أضف صنفاً واحداً على الأقل"),
});

export type DispatchStockTransferFormValues = z.infer<
  typeof dispatchStockTransferSchema
>;
