"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import {
  invoiceSettingsSchema,
  type InvoiceSettingsFormValues,
} from "../schema";
import {
  useInvoiceSettingsQuery,
  useUpdateInvoiceSettingsMutation,
} from "../hooks";

export function InvoiceSettingsView() {
  const { data, isLoading } = useInvoiceSettingsQuery();
  const settings = data?.data?.settings;

  const form = useForm<InvoiceSettingsFormValues>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      company_name: "",
      tax_registration_no: "",
      address: "",
      phone: "",
      overdue_threshold_days: "7",
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        tax_registration_no: settings.tax_registration_no,
        address: settings.address,
        phone: settings.phone,
        overdue_threshold_days: String(settings.overdue_threshold_days),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const { mutate, isPending } = useUpdateInvoiceSettingsMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const onSubmit = (values: InvoiceSettingsFormValues) => {
    setBanner(null);
    setSaved(false);
    mutate(
      {
        company_name: values.company_name || undefined,
        tax_registration_no: values.tax_registration_no || undefined,
        address: values.address || undefined,
        phone: values.phone || undefined,
        overdue_threshold_days: Number(values.overdue_threshold_days),
      },
      {
        onSuccess: () => setSaved(true),
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                إعدادات الفواتير
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                تُطبع هذه البيانات على كل فاتورة جديدة تصدر من الآن فصاعداً —
                تعديلها لا يغيّر الفواتير المُصدرة سابقاً.
              </p>
            </div>
            <Button type="submit" disabled={isPending || isLoading} className="shrink-0">
              {isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>

          {banner && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {banner}
            </p>
          )}
          {saved && (
            <p className="rounded-lg bg-green-600/10 px-3 py-2 text-sm text-green-600">
              تم حفظ إعدادات الفواتير
            </p>
          )}

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الشركة على الفاتورة</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    isLoading={isLoading}
                    placeholder={settings?.display_company_name}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  اتركه فارغاً لاستخدام اسم شركتك المسجّل تلقائياً
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الرقم الضريبي</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    isLoading={isLoading}
                    dir="ltr"
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input {...field} isLoading={isLoading} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      isLoading={isLoading}
                      dir="ltr"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overdue_threshold_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عتبة التأخّر (أيام)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      isLoading={isLoading}
                      inputMode="numeric"
                      dir="ltr"
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription>
                    تُستخدم لتحديد الفاتورة المتأخرة في التقرير
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
