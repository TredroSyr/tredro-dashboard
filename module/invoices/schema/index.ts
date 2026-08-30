import { z } from "zod";

/** Decimal string like the API expects for money — never a JS number. */
const moneyString = z
  .string()
  .min(1, "المبلغ مطلوب")
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "أدخل مبلغاً صحيحاً")
  .refine((v) => Number(v) > 0, "يجب أن يكون المبلغ أكبر من صفر");

const quantityString = z
  .string()
  .min(1, "الكمية مطلوبة")
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), "أدخل كمية صحيحة")
  .refine((v) => Number(v) > 0, "يجب أن تكون الكمية أكبر من صفر");

// ---- Record a payment against a sales invoice ----
export const recordPaymentSchema = (balanceDue: number) =>
  z.object({
    amount: moneyString.refine(
      (v) => Number(v) <= balanceDue,
      "المبلغ يتجاوز الرصيد المتبقي على الفاتورة",
    ),
    note: z.string().optional(),
    collected_by: z.string().optional(),
  });

export type RecordPaymentFormValues = z.infer<
  ReturnType<typeof recordPaymentSchema>
>;

// ---- Create a sales invoice (admin dashboard — direct sale or on a rep's behalf) ----
export const createSalesInvoiceLineSchema = z.object({
  product_id: z.string().min(1, "اختر منتجاً"),
  quantity: quantityString,
  unit_price: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "أدخل سعراً صحيحاً"),
});

export const createSalesInvoiceSchema = z.object({
  customer_id: z.string().min(1, "اختر زبوناً"),
  rep: z.string().optional(),
  warehouse: z.string().optional(),
  notes: z.string().optional(),
  payment_amount: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "أدخل مبلغاً صحيحاً"),
  lines: z
    .array(createSalesInvoiceLineSchema)
    .min(1, "أضف صنفاً واحداً على الأقل"),
});

export type CreateSalesInvoiceFormValues = z.infer<
  typeof createSalesInvoiceSchema
>;

// ---- Create an incoming invoice ----
export const incomingInvoiceLineSchema = z.object({
  product_id: z.string().min(1, "اختر منتجاً"),
  quantity: quantityString,
  unit_price: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d+(\.\d{1,2})?$/.test(v),
      "أدخل سعراً صحيحاً",
    ),
});

export const createIncomingInvoiceSchema = z.object({
  warehouse: z.string().min(1, "مستودع الشركة مطلوب"),
  /** Settlement currency with the supplier — chosen once for the whole invoice, before its lines. */
  currency: z.string().min(1, "العملة مطلوبة"),
  supplier_ref: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(incomingInvoiceLineSchema).min(1, "أضف صنفاً واحداً على الأقل"),
});

export type CreateIncomingInvoiceFormValues = z.infer<
  typeof createIncomingInvoiceSchema
>;

// ---- Create a return invoice ----
export const returnInvoiceLineSchema = z.object({
  sales_invoice_line_id: z.string().min(1),
  product_name: z.string(),
  max_quantity: z.number(),
  unit_price: z.string(),
  quantity: z.string(),
});

export const createReturnInvoiceSchema = z
  .object({
    notes: z.string().optional(),
    lines: z.array(returnInvoiceLineSchema),
  })
  .superRefine((data, ctx) => {
    const selected = data.lines.filter((l) => Number(l.quantity || 0) > 0);
    if (selected.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "أدخل كمية مرتجعة لصنف واحد على الأقل",
        path: ["lines"],
      });
    }
    data.lines.forEach((line, index) => {
      if (!line.quantity) return;
      if (!/^\d+(\.\d{1,3})?$/.test(line.quantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "أدخل كمية صحيحة",
          path: ["lines", index, "quantity"],
        });
        return;
      }
      const qty = Number(line.quantity);
      if (qty > line.max_quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `لا يمكن إرجاع أكثر من ${line.max_quantity}`,
          path: ["lines", index, "quantity"],
        });
      }
    });
  });

export type CreateReturnInvoiceFormValues = z.infer<
  typeof createReturnInvoiceSchema
>;

// ---- Issue a return that creates an overage: force a refund method ----
export const refundMethodSchema = z.object({
  refund_method: z.enum(["cash_refunded_by_rep", "deferred_customer_credit"], {
    required_error: "اختر طريقة رد المبلغ الزائد",
    invalid_type_error: "اختر طريقة رد المبلغ الزائد",
  }),
});

export type RefundMethodFormValues = z.infer<typeof refundMethodSchema>;

// ---- Invoice settings ----
export const invoiceSettingsSchema = z.object({
  company_name: z.string().optional(),
  tax_registration_no: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  overdue_threshold_days: z
    .string()
    .refine((v) => /^\d+$/.test(v), "أدخل رقماً صحيحاً"),
});

export type InvoiceSettingsFormValues = z.infer<typeof invoiceSettingsSchema>;
