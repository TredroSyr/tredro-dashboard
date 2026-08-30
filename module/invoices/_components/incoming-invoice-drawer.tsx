"use client";

import * as React from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useProductsQuery } from "@/module/products/hook";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import {
  createIncomingInvoiceSchema,
  type CreateIncomingInvoiceFormValues,
} from "../schema";
import { useCreateIncomingInvoiceMutation } from "../hooks";
import { useWarehousesQuery } from "@/module/warehouses/hooks";
import { WarehouseFormDialog } from "@/module/warehouses/_components/warehouse-form-dialog";
import type { Warehouse } from "@/module/warehouses/types";
import { useIsMobile } from "@/hooks/use-mobile";

const EMPTY_LINE = { product_id: "", quantity: "", unit_price: "" };

export function IncomingInvoiceDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const form = useForm<CreateIncomingInvoiceFormValues>({
    resolver: zodResolver(createIncomingInvoiceSchema),
    defaultValues: {
      warehouse: "",
      supplier_ref: "",
      notes: "",
      lines: [EMPTY_LINE],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        warehouse: "",
        supplier_ref: "",
        notes: "",
        lines: [EMPTY_LINE],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: productsRes, isLoading: isLoadingProducts } =
    useProductsQuery();
  const productOptions = React.useMemo(
    () =>
      (productsRes?.data?.products ?? []).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [productsRes],
  );

  const { data: warehousesRes, isLoading: isLoadingWarehouses } =
    useWarehousesQuery({
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
  const [createWarehouseOpen, setCreateWarehouseOpen] = React.useState(false);

  const { mutate, isPending } = useCreateIncomingInvoiceMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: CreateIncomingInvoiceFormValues) => {
    setBanner(null);
    mutate(
      {
        warehouse: Number(values.warehouse),
        supplier_ref: values.supplier_ref || undefined,
        notes: values.notes || undefined,
        lines: values.lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: l.quantity,
          unit_price: l.unit_price || undefined,
        })),
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        swipeDirection={isMobile ? "down" : "left"}
      >
        <DrawerContent className="flex flex-col w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl lg:max-w-2xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              <DrawerHeader className="flex-row items-center justify-between gap-3 px-4 pt-6 pb-3 sm:px-6 sm:pt-4 sticky top-0 z-10 bg-background border-b border-border">
                <DrawerTitle className="text-right text-base sm:text-lg">
                  فاتورة إدخال جديدة
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
                  تُنشأ فاتورة الإدخال كمسودة ولا تُضاف الكمية للمستودع إلا بعد
                  ترحيلها من قائمة فواتير الإدخال.
                </p>

                <FormField
                  control={form.control}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مستودع الشركة</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={warehouseOptions}
                          value={field.value}
                          onChange={field.onChange}
                          loading={isLoadingWarehouses}
                          placeholder="اختر مستودعاً"
                          searchPlaceholder="ابحث عن مستودع..."
                          emptyText="لا توجد مستودعات بعد"
                          onCreateNew={() => setCreateWarehouseOpen(true)}
                          createNewLabel="إضافة مستودع جديد"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier_ref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المورّد (اختياري)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="مثال: الشركة الأم"
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

      <WarehouseFormDialog
        warehouse={null}
        open={createWarehouseOpen}
        onOpenChange={setCreateWarehouseOpen}
        lockOwnerType="company"
        onCreated={(warehouse: Warehouse) =>
          form.setValue("warehouse", String(warehouse.id), {
            shouldValidate: true,
          })
        }
      />
    </>
  );
}
