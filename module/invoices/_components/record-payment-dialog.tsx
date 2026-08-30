"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import { LedgerBar } from "./ledger-bar";
import { recordPaymentSchema, type RecordPaymentFormValues } from "../schema";
import { useRecordPaymentMutation } from "../hooks";
import type { SalesInvoice } from "../types";
import { formatMoney, num } from "../lib/format";

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: SalesInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const balanceDue = invoice ? num(invoice.balance_due) : 0;
  const schema = React.useMemo(() => recordPaymentSchema(balanceDue), [balanceDue]);

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", note: "", collected_by: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ amount: "", note: "", collected_by: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const { mutate, isPending } = useRecordPaymentMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: RecordPaymentFormValues) => {
    if (!invoice) return;
    setBanner(null);
    mutate(
      {
        invoiceId: invoice.id,
        payload: {
          amount: values.amount,
          note: values.note || undefined,
          collected_by: values.collected_by
            ? Number(values.collected_by)
            : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const result = handleApiError(error);
          setBanner(result.message);
        },
      },
    );
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة — {invoice.number}</DialogTitle>
          <DialogDescription>
            {invoice.customer_name} · الرصيد المتبقي {formatMoney(invoice.balance_due)}
          </DialogDescription>
        </DialogHeader>

        <LedgerBar
          size="lg"
          totalAmount={invoice.total_amount}
          paidAmount={invoice.paid_amount}
          returnedAmount={invoice.returned_amount}
          balanceDue={invoice.balance_due}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {banner && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {banner}
              </p>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ المحصَّل</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="decimal"
                      dir="ltr"
                      placeholder={`الحد الأقصى ${formatMoney(invoice.balance_due)}`}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collected_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المندوب المُحصِّل (اختياري)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={repOptions}
                      value={field.value}
                      onChange={field.onChange}
                      loading={isLoadingReps}
                      placeholder="تحصيل مباشر من المكتب"
                      searchPlaceholder="ابحث عن مندوب..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظة (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="مثال: تحصيل نقدي عند الزيارة"
                      className="min-h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
