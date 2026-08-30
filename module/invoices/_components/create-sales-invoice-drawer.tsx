"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconRenderer } from "@/assets/icons/iconRenderer";
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
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { useProductsQuery } from "@/module/products/hook";
import { useWarehousesQuery } from "@/module/warehouses/hooks";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import {
  createSalesInvoiceSchema,
  type CreateSalesInvoiceFormValues,
} from "../schema";
import { useCreateSalesInvoiceMutation, useCustomerCreditsQuery } from "../hooks";
import { formatMoney, num } from "../lib/format";

const DIRECT_SALE_VALUE = "";
const EMPTY_LINE = { product_id: "", quantity: "", unit_price: "" };

export function CreateSalesInvoiceDrawer({
  open,
  onOpenChange,
  defaultCustomerId,
  defaultRepId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select and lock the customer (e.g. opened from that customer's detail page). */
  defaultCustomerId?: string | number;
  /** Pre-select and lock the rep (e.g. opened from that rep's detail page). */
  defaultRepId?: string | number;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const form = useForm<CreateSalesInvoiceFormValues>({
    resolver: zodResolver(createSalesInvoiceSchema),
    defaultValues: {
      customer_id: defaultCustomerId ? String(defaultCustomerId) : "",
      rep: defaultRepId ? String(defaultRepId) : DIRECT_SALE_VALUE,
      warehouse: "",
      notes: "",
      payment_amount: "",
      lines: [EMPTY_LINE],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const [selectedCreditIds, setSelectedCreditIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open) {
      form.reset({
        customer_id: defaultCustomerId ? String(defaultCustomerId) : "",
        rep: defaultRepId ? String(defaultRepId) : DIRECT_SALE_VALUE,
        warehouse: "",
        notes: "",
        payment_amount: "",
        lines: [EMPTY_LINE],
      });
      setSelectedCreditIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCustomerId, defaultRepId]);

  const customerId = form.watch("customer_id");

  React.useEffect(() => {
    setSelectedCreditIds([]);
  }, [customerId]);

  const { data: creditsRes } = useCustomerCreditsQuery(
    { customer: customerId ? Number(customerId) : undefined, status: "pending" },
    { enabled: Boolean(customerId) },
  );
  const pendingCredits = creditsRes?.data?.credits ?? [];
  const selectedCreditsTotal = pendingCredits
    .filter((c) => selectedCreditIds.includes(c.id))
    .reduce((sum, c) => sum + num(c.amount), 0);

  const toggleCredit = (id: number) => {
    setSelectedCreditIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const rep = form.watch("rep");
  const isDirectSale = !rep;

  // Clear the picked warehouse whenever the sale's shape changes (direct vs. on a rep's behalf) —
  // a warehouse valid for one shape is never valid for the other (frontend2.md §5).
  React.useEffect(() => {
    form.setValue("warehouse", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep]);

  const { data: customersRes } = useCustomersQuery();
  const customerOptions = React.useMemo(
    () =>
      (customersRes?.data?.customers ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [customersRes],
  );

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const repOptions = React.useMemo(
    () => [
      { value: DIRECT_SALE_VALUE, label: "بيع مباشر من الشركة (بدون مندوب)" },
      ...(repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    ],
    [repsRes],
  );

  const { data: warehousesRes, isLoading: isLoadingWarehouses } = useWarehousesQuery({
    is_active: true,
    owner_type: isDirectSale ? "company" : "rep",
  });
  const warehouseOptions = React.useMemo(() => {
    const all = warehousesRes?.data?.warehouses ?? [];
    const scoped = isDirectSale ? all : all.filter((w) => w.rep === Number(rep));
    return scoped.map((w) => ({ value: String(w.id), label: w.name }));
  }, [warehousesRes, isDirectSale, rep]);

  const { data: productsRes, isLoading: isLoadingProducts } = useProductsQuery();
  const productOptions = React.useMemo(
    () =>
      (productsRes?.data?.products ?? []).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [productsRes],
  );

  const { mutate, isPending } = useCreateSalesInvoiceMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: CreateSalesInvoiceFormValues) => {
    setBanner(null);
    mutate(
      {
        customer_id: Number(values.customer_id),
        rep: values.rep ? Number(values.rep) : undefined,
        warehouse: values.warehouse ? Number(values.warehouse) : undefined,
        notes: values.notes || undefined,
        payment_amount: values.payment_amount || undefined,
        lines: values.lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: l.quantity,
          unit_price: l.unit_price || undefined,
        })),
        credit_ids: selectedCreditIds.length > 0 ? selectedCreditIds : undefined,
      },
      {
        onSuccess: (res) => {
          onOpenChange(false);
          router.push(`/invoices/detail?id=${res.data.invoice.id}`);
        },
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "left"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="flex flex-col w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl lg:max-w-2xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DrawerHeader className="flex-row items-center justify-between gap-3 px-4 pt-6 pb-3 sm:px-6 sm:pt-4 sticky top-0 z-10 bg-background border-b border-border">
              <DrawerTitle className="text-right text-base sm:text-lg">
                فاتورة بيع جديدة
              </DrawerTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "جارٍ الحفظ..." : "إصدار الفاتورة"}
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
                لا يوجد تراجع بعد الإصدار — لا يمكن إعادة إرسال هذا النموذج
                تلقائياً عند انقطاع الاتصال، تجنّب الضغط على الزر أكثر من مرة.
              </p>

              {defaultCustomerId ? (
                <FormItem>
                  <FormLabel>الزبون</FormLabel>
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground">
                    <IconRenderer name="user_outlined" className="size-4 text-muted-foreground" />
                    {customerOptions.find((c) => c.value === String(defaultCustomerId))
                      ?.label ?? "..."}
                  </div>
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الزبون</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={customerOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="اختر زبوناً"
                          searchPlaceholder="ابحث عن زبون..."
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {pendingCredits.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-medium text-foreground">
                    لهذا الزبون رصيد دائن معلّق بقيمة{" "}
                    {formatMoney(
                      pendingCredits.reduce((sum, c) => sum + num(c.amount), 0),
                    )}{" "}
                    — هل تريد تطبيقه على هذه الفاتورة؟
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {pendingCredits.map((credit) => (
                      <label
                        key={credit.id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="accent-primary"
                            checked={selectedCreditIds.includes(credit.id)}
                            onChange={() => toggleCredit(credit.id)}
                          />
                          مرتجع {credit.source_return_invoice_number}
                        </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatMoney(credit.amount)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedCreditIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      سيُطبَّق {formatMoney(selectedCreditsTotal)} من الرصيد الدائن
                      كدفعة على هذه الفاتورة.
                    </p>
                  )}
                </div>
              )}

              {defaultRepId ? (
                <FormItem>
                  <FormLabel>المندوب</FormLabel>
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground">
                    <IconRenderer name="users_outlined" className="size-4 text-muted-foreground" />
                    {repOptions.find((r) => r.value === String(defaultRepId))?.label ??
                      "..."}
                  </div>
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="rep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المندوب</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={repOptions}
                          value={field.value}
                          onChange={field.onChange}
                          loading={isLoadingReps}
                          searchPlaceholder="ابحث عن مندوب..."
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        اترك هذا الحقل على "بيع مباشر" لبيع من مستودع الشركة دون
                        نسب البيع لأي مندوب
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isDirectSale ? "مستودع الشركة (اختياري)" : "فان المندوب (اختياري)"}
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={warehouseOptions}
                        value={field.value}
                        onChange={field.onChange}
                        loading={isLoadingWarehouses}
                        placeholder="افتراضي — أقدم مستودع نشط"
                        searchPlaceholder="ابحث عن مستودع..."
                        emptyText={
                          isDirectSale
                            ? "لا توجد مستودعات شركة نشطة"
                            : "لا يوجد فان نشط لهذا المندوب"
                        }
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <FormLabel>الأصناف</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => append(EMPTY_LINE)}
                  >
                    <IconRenderer name="plus_outlined" className="size-3.5" />
                    إضافة صنف
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-xl border border-border p-3"
                  >
                    <div className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.product_id`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <SearchableSelect
                                options={productOptions}
                                value={field.value}
                                onChange={field.onChange}
                                loading={isLoadingProducts}
                                placeholder="اختر منتجاً"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="mt-0.5 text-destructive"
                          onClick={() => remove(index)}
                        >
                          <IconRenderer name="bin_outlined" className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                inputMode="decimal"
                                dir="ltr"
                                placeholder="الكمية"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                inputMode="decimal"
                                dir="ltr"
                                placeholder="سعر الوحدة (اختياري)"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <FormField
                control={form.control}
                name="payment_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ محصَّل الآن (اختياري)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="decimal"
                        dir="ltr"
                        placeholder="اتركه فارغاً لفاتورة آجلة بالكامل"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-20" />
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
