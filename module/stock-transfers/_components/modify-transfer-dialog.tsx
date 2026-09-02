"use client";

import * as React from "react";
import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import { useModifyStockTransferMutation } from "../hooks";
import { formatQuantity } from "../lib/format";
import type { StockTransfer } from "../types";

const lineSchema = z.object({
  line_id: z.number(),
  product_name: z.string(),
  max_quantity: z.number(),
  approved_qty: z
    .string()
    .min(1, "أدخل كمية")
    .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), "أدخل كمية صحيحة"),
});

const modifyFormSchema = z.object({
  lines: z.array(lineSchema),
});

type ModifyFormValues = z.infer<typeof modifyFormSchema>;

export function ModifyTransferDialog({
  transfer,
  open,
  onOpenChange,
}: {
  transfer: StockTransfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<ModifyFormValues>({
    resolver: zodResolver(modifyFormSchema),
    defaultValues: { lines: [] },
  });

  const { fields } = useFieldArray({ control: form.control, name: "lines" });

  React.useEffect(() => {
    if (open && transfer) {
      form.reset({
        lines: (transfer.lines ?? []).map((line) => ({
          line_id: line.id,
          product_name: line.product_name,
          max_quantity: Number(line.requested_qty),
          approved_qty: line.approved_qty ?? line.requested_qty,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transfer?.id]);

  const { mutate, isPending } = useModifyStockTransferMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: ModifyFormValues) => {
    if (!transfer) return;
    // Cap client-side at the requested quantity — the server rejects anything higher anyway.
    const overCap = values.lines.find(
      (l) => Number(l.approved_qty) > l.max_quantity,
    );
    if (overCap) {
      form.setError(
        `lines.${values.lines.indexOf(overCap)}.approved_qty` as const,
        { message: `لا يمكن أن تتجاوز ${formatQuantity(overCap.max_quantity)}` },
      );
      return;
    }

    setBanner(null);
    mutate(
      {
        id: transfer.id,
        payload: {
          lines: values.lines.map((l) => ({
            line_id: l.line_id,
            approved_qty: l.approved_qty,
          })),
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  if (!transfer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل الكميات — {transfer.number}</DialogTitle>
          <DialogDescription>
            الكميات التي لا تعدّلها تبقى كما طلبها المندوب.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            {banner && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {banner}
              </p>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {field.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      المطلوب: {formatQuantity(field.max_quantity)}
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name={`lines.${index}.approved_qty`}
                    render={({ field: qtyField }) => (
                      <FormItem className="w-28">
                        <FormControl>
                          <Input
                            {...qtyField}
                            inputMode="decimal"
                            dir="ltr"
                            className="h-10 text-center"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جارٍ الحفظ..." : "حفظ التعديل"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
