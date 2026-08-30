"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
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
import { getProduct } from "@/module/products/api";
import { useWarehousesQuery } from "@/module/warehouses/hooks";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import {
  createSalesInvoiceSchema,
  type CreateSalesInvoiceFormValues,
} from "../schema";
import { useCreateSalesInvoiceMutation, useCustomerCreditsQuery } from "../hooks";
import { formatMoney, num } from "../lib/format";
import {
  canAddProductToInvoice,
  currencyMismatchMessage,
  getInvoiceCurrency,
  pickPriceForCurrency,
  type ResolvedPrice,
} from "../lib/currency";

const DIRECT_SALE_VALUE = "";
const EMPTY_LINE = { product_id: "", quantity: "", unit_price: "" };

type LineResolution =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "mismatch"; lockedCurrency: string }
  | { status: "ok"; price: ResolvedPrice };

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

  // Per-line bookkeeping for the currency guard below — plain refs, not state,
  // since they're only ever read/written from inside the sync effect.
  const lastValidLineRef = React.useRef<
    Record<string, { productId: string; price: string }>
  >({});
  const lastAutoPriceRef = React.useRef<Record<string, string>>({});

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
      lastValidLineRef.current = {};
      lastAutoPriceRef.current = {};
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
  const customerCategoryId = React.useMemo(() => {
    const selected = (customersRes?.data?.customers ?? []).find(
      (c) => String(c.id) === customerId,
    );
    return selected?.category_details?.id ?? null;
  }, [customersRes, customerId]);

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
    owner_type: "company",
  });
  const warehouseOptions = React.useMemo(
    () =>
      (warehousesRes?.data?.warehouses ?? []).map((w) => ({
        value: String(w.id),
        label: w.name,
      })),
    [warehousesRes],
  );

  const { data: productsRes, isLoading: isLoadingProducts } = useProductsQuery();
  const productOptions = React.useMemo(
    () =>
      (productsRes?.data?.products ?? []).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [productsRes],
  );

  // Fetch each line's selected product in full (its per-currency/per-category
  // price list lives on the detail response, not the list one) so we can
  // enforce a single currency per invoice — see module/invoices/lib/currency.ts.
  const watchedLines = form.watch("lines") ?? [];
  const productQueries = useQueries({
    queries: watchedLines.map((line) => ({
      queryKey: ["products", "detail", line.product_id],
      queryFn: () => getProduct(line.product_id),
      enabled: Boolean(line.product_id),
    })),
  });

  let lockCurrency: string | null = null;
  const lineResolutions: LineResolution[] = watchedLines.map((line, i) => {
    if (!line.product_id) return { status: "empty" };
    const product = productQueries[i]?.data?.data?.product;
    if (!product) return { status: "loading" };
    const gate = canAddProductToInvoice(product, lockCurrency);
    if (!gate.ok) {
      return { status: "mismatch", lockedCurrency: lockCurrency as string };
    }
    if (!lockCurrency) lockCurrency = gate.price.currency_code;
    const price =
      pickPriceForCurrency(product, gate.price.currency_code, customerCategoryId) ??
      gate.price;
    return { status: "ok", price };
  });

  const invoiceCurrency = getInvoiceCurrency(
    lineResolutions.map((r) => (r.status === "ok" ? r.price.currency_code : null)),
  );
  const currencyMismatch = lineResolutions.find(
    (r): r is Extract<LineResolution, { status: "mismatch" }> =>
      r.status === "mismatch",
  );
  const currencyWarning = currencyMismatch
    ? currencyMismatchMessage(currencyMismatch.lockedCurrency)
    : null;

  // Sync resolved prices/currency conflicts back onto the form: autofill an
  // untouched unit_price, or revert a line whose product doesn't match the
  // invoice's locked currency (the "why" is shown via the banner above, driven
  // by `currencyWarning` computed directly from `lineResolutions` above).
  React.useEffect(() => {
    fields.forEach((field, i) => {
      const resolution = lineResolutions[i];
      const line = watchedLines[i];
      if (!resolution || !line) return;
      const fieldId = field.id;

      if (resolution.status === "empty") {
        delete lastValidLineRef.current[fieldId];
        delete lastAutoPriceRef.current[fieldId];
        return;
      }
      if (resolution.status === "loading") return;

      if (resolution.status === "mismatch") {
        const prev = lastValidLineRef.current[fieldId];
        if (line.product_id !== (prev?.productId ?? "")) {
          form.setValue(`lines.${i}.product_id`, prev?.productId ?? "", {
            shouldValidate: false,
          });
          form.setValue(`lines.${i}.unit_price`, prev?.price ?? "");
        }
        return;
      }

      // status === "ok"
      lastValidLineRef.current[fieldId] = {
        productId: line.product_id,
        price: resolution.price.price,
      };
      const currentValue = form.getValues(`lines.${i}.unit_price`);
      if (!currentValue || currentValue === lastAutoPriceRef.current[fieldId]) {
        form.setValue(`lines.${i}.unit_price`, resolution.price.price, {
          shouldValidate: true,
        });
      }
      lastAutoPriceRef.current[fieldId] = resolution.price.price;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineResolutions, fields, watchedLines]);

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
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || Boolean(currencyMismatch)}
                >
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

              {currencyWarning && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {currencyWarning}
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

              {isDirectSale && (
                <FormField
                  control={form.control}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مستودع الشركة (اختياري)</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={warehouseOptions}
                          value={field.value}
                          onChange={field.onChange}
                          loading={isLoadingWarehouses}
                          placeholder="افتراضي — أقدم مستودع نشط"
                          searchPlaceholder="ابحث عن مستودع..."
                          emptyText="لا توجد مستودعات شركة نشطة"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FormLabel>الأصناف</FormLabel>
                    {invoiceCurrency && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        عملة الفاتورة: {invoiceCurrency}
                      </span>
                    )}
                  </div>
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
                  <InvoiceLineItem
                    key={field.id}
                    index={index}
                    productOptions={productOptions}
                    isLoadingProducts={isLoadingProducts}
                    resolution={lineResolutions[index] ?? { status: "empty" }}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                  />
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

/**
 * Renders one invoice line. Purely presentational — the parent drawer fetches
 * every line's product detail, enforces the single-currency-per-invoice rule,
 * and autofills the price; this component just reflects whatever `resolution`
 * it's handed (see module/invoices/lib/currency.ts and the sync effect above).
 */
function InvoiceLineItem({
  index,
  productOptions,
  isLoadingProducts,
  resolution,
  canRemove,
  onRemove,
}: {
  index: number;
  productOptions: { value: string; label: string }[];
  isLoadingProducts: boolean;
  resolution: LineResolution;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { control } = useFormContext<CreateSalesInvoiceFormValues>();
  const resolvedCurrency = resolution.status === "ok" ? resolution.price.currency_code : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex items-start gap-2">
        <FormField
          control={control}
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
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 text-destructive"
            onClick={onRemove}
          >
            <IconRenderer name="bin_outlined" className="size-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={control}
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
          control={control}
          name={`lines.${index}.unit_price`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    inputMode="decimal"
                    dir="ltr"
                    placeholder="سعر الوحدة (اختياري)"
                    className={resolvedCurrency ? "h-10 pr-12" : "h-10"}
                  />
                  {resolvedCurrency && (
                    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-medium text-muted-foreground">
                      {resolvedCurrency}
                    </span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
