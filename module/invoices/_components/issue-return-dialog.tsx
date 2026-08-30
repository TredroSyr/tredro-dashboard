"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useIssueReturnInvoiceMutation } from "../hooks";
import { refundMethodSchema, type RefundMethodFormValues } from "../schema";
import type { ReturnInvoice } from "../types";
import { formatMoney, num } from "../lib/format";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";

const REFUND_OPTIONS: {
  value: "cash_refunded_by_rep" | "deferred_customer_credit";
  label: string;
  description: string;
}[] = [
  {
    value: "cash_refunded_by_rep",
    label: "أعاد المندوب المبلغ نقداً",
    description: "يُخصم من صافي التحصيل المتوقّع لهذا المندوب، دون إنشاء مستند جديد.",
  },
  {
    value: "deferred_customer_credit",
    label: "رصيد دائن للزبون",
    description: "يُسجَّل كرصيد دائن يُطبَّق يدوياً على فاتورة قادمة لهذا الزبون.",
  },
];

/** Pulls the overage amount the server reports in errors.overage_amount (e.g. ["30.00"]). */
function getOverageAmountFromError(error: unknown): number | null {
  if (!isAxiosError<{ errors?: Record<string, string[]> }>(error)) return null;
  const raw = error.response?.data?.errors?.overage_amount?.[0];
  if (!raw) return null;
  const parsed = num(raw);
  return parsed > 0 ? parsed : null;
}

/** Handles both a plain issue (no overage) and one that requires picking a refund method. */
export function IssueReturnDialog({
  returnInvoice,
  open,
  onOpenChange,
  onIssued,
}: {
  returnInvoice: ReturnInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued?: () => void;
}) {
  const { mutate, isPending } = useIssueReturnInvoiceMutation();
  const [banner, setBanner] = React.useState<string | null>(null);
  // Set when the server rejects a plain issue because it detects an overage
  // we couldn't compute locally (the list/detail GET doesn't always carry
  // projected_overage_amount) — falls back to the amount in errors.overage_amount.
  const [serverOverage, setServerOverage] = React.useState<number | null>(null);

  const localOverage = returnInvoice
    ? num(returnInvoice.projected_overage_amount ?? returnInvoice.overage_amount)
    : 0;
  const overage = serverOverage ?? localOverage;
  const needsRefundMethod = overage > 0;

  const form = useForm<RefundMethodFormValues>({
    resolver: zodResolver(refundMethodSchema),
    defaultValues: { refund_method: "cash_refunded_by_rep" },
  });
  const handleApiError = useApiFormErrorHandler(form);

  React.useEffect(() => {
    if (open) {
      setBanner(null);
      setServerOverage(null);
      form.reset({ refund_method: "cash_refunded_by_rep" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, returnInvoice?.id]);

  const doIssue = (refundMethod?: "cash_refunded_by_rep" | "deferred_customer_credit") => {
    if (!returnInvoice) return;
    setBanner(null);
    mutate(
      { id: returnInvoice.id, payload: refundMethod ? { refund_method: refundMethod } : undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          onIssued?.();
        },
        onError: (error) => {
          const { message, fields } = handleApiError(error);
          setBanner(message);
          if (fields.includes("refund_method")) {
            const amount = getOverageAmountFromError(error);
            setServerOverage(amount ?? (localOverage || 0.01));
          }
        },
      },
    );
  };

  if (!returnInvoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ترحيل مرتجع — {returnInvoice.number}</DialogTitle>
          <DialogDescription>
            سيُعاد المبلغ {formatMoney(returnInvoice.amount, returnInvoice.currency)} لمستودع
            {" "}
            {returnInvoice.warehouse_name}، ويُخصم تلقائياً من فاتورة البيع
            {" "}
            {returnInvoice.sales_invoice_number}.
          </DialogDescription>
        </DialogHeader>

        {banner && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {banner}
          </p>
        )}

        {needsRefundMethod ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => doIssue(values.refund_method))}
              className="flex flex-col gap-4"
            >
              <div className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                هذا المرتجع يتجاوز المبلغ المتبقي على الفاتورة بمقدار{" "}
                {formatMoney(overage, returnInvoice.currency)} — اختر كيف يُرَدّ هذا الفرق للزبون.
              </div>

              <FormField
                control={form.control}
                name="refund_method"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        {REFUND_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={
                              "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors " +
                              (field.value === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/40")
                            }
                          >
                            <span className="flex items-center gap-2 font-medium text-foreground">
                              <input
                                type="radio"
                                className="accent-primary"
                                checked={field.value === opt.value}
                                onChange={() => field.onChange(opt.value)}
                              />
                              {opt.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {opt.description}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "جارٍ الترحيل..." : "ترحيل المرتجع"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <DialogFooter>
            <Button disabled={isPending} onClick={() => doIssue()}>
              {isPending ? "جارٍ الترحيل..." : "ترحيل المرتجع"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
