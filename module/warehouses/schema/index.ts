import { z } from "zod";

export const warehouseFormSchema = z
  .object({
    name: z.string().min(1, "اسم المستودع مطلوب"),
    address: z.string().optional(),
    kind: z.string().optional(),
    owner_type: z.enum(["company", "rep"]),
    rep: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.owner_type === "rep" && !data.rep) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "مستودع المندوب يجب أن يرتبط بمندوب",
        path: ["rep"],
      });
    }
  });

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
