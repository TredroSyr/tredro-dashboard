"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import {
  createReturnInvoiceSchema,
  type CreateReturnInvoiceFormValues,
} from "../schema";
import { useCreateReturnInvoiceMutation } from "../hooks";
import type { SalesInvoice } from "../types";
import { formatMoney, formatQuantity, num } from "../lib/format";
import { useIsMobile } from "@/hooks/use-mobile";

export function CreateReturnDrawer({
  invoice,
  open,
  onOpenChange,
  onCreated,
}: {
  invoice: SalesInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const isMobile = useIsMobile();
  const eligibleLines = React.useMemo(
    () =>
      (invoice?.lines ?? [])
        .map((line) => {
          const qty = num(line.quantity);
          const returned = num(line.returned_quantity);
          const remaining = Math.max(0, qty - returned);
          return { line, remaining };
        })
        .filter((entry) => entry.remaining > 0),
    [invoice],
  );

  const form = useForm<CreateReturnInvoiceFormValues>({
    resolver: zodResolver(createReturnInvoiceSchema),
    defaultValues: { notes: "", lines: [] },
  });

  const { fields } = useFieldArray({ control: form.control, name: "lines" });

  React.useEffect(() => {
    if (open) {
      form.reset({
        notes: "",
        lines: eligibleLines.map(({ line, remaining }) => ({
          sales_invoice_line_id: String(line.id),
          product_name: line.product_name,
          max_quantity: remaining,
          unit_price: line.unit_price,
          quantity: "",
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  const { mutate, isPending } = useCreateReturnInvoiceMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: CreateReturnInvoiceFormValues) => {
    if (!invoice) return;
    setBanner(null);
    const selected = values.lines.filter((l) => Number(l.quantity || 0) > 0);
    mutate(
      {
        sales_invoice: invoice.id,
        notes: values.notes || undefined,
        lines: selected.map((l) => ({
          sales_invoice_line_id: Number(l.sales_invoice_line_id),
          quantity: l.quantity,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onCreated?.();
        },
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  if (!invoice) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isMobile ? "down" : "left"}
    >
      <DrawerContent className="flex flex-col w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DrawerHeader className="flex-row items-center justify-between gap-3 px-4 pt-6 pb-3 sm:px-6 sm:pt-4 sticky top-0 z-10 bg-background border-b border-border">
              <DrawerTitle className="text-right text-base sm:text-lg">
                تسجيل مرتجع — {invoice.number}
              </DrawerTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "جارٍ الحفظ..." : "حفظ كمسودة"}
                </Button>
                <DrawerClose>
                  <Button type="button" variant="outline" size="sm">
                    إلغاء
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 px-4 py-4 pb-8 sm:px-6 sm:pb-6">
              {banner && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {banner}
                </p>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">
                أدخل الكمية المُرجَعة لكل صنف. يُنشأ المرتجع كمسودة أولاً، ثم
                يمكنك ترحيله لخصم قيمته من رصيد الفاتورة.
              </p>

              {eligibleLines.length === 0 ? (
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  لا توجد كميات قابلة للإرجاع على هذه الفاتورة.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
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
                          الكمية المباعة القابلة للإرجاع:{" "}
                          {formatQuantity(field.max_quantity)} ·{" "}
                          {formatMoney(field.unit_price, invoice.currency)}{" "}
                          للوحدة
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field: qtyField }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <Input
                                {...qtyField}
                                inputMode="decimal"
                                dir="ltr"
                                placeholder="0"
                                className="h-10 text-center"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  {typeof form.formState.errors.lines?.message === "string" && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lines.message}
                    </p>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="مثال: بضاعة تالفة"
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
