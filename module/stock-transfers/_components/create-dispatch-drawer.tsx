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
import { useIsMobile } from "@/hooks/use-mobile";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import { useRepsQuery } from "@/module/reps/hooks";
import { useProductsQuery } from "@/module/products/hook";
import {
  dispatchStockTransferSchema,
  type DispatchStockTransferFormValues,
} from "../schema";
import { useCreateStockTransferMutation } from "../hooks";

const EMPTY_LINE = { product_id: "", quantity: "" };

export function CreateDispatchDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  const form = useForm<DispatchStockTransferFormValues>({
    resolver: zodResolver(dispatchStockTransferSchema),
    defaultValues: { rep: "", notes: "", lines: [EMPTY_LINE] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ rep: "", notes: "", lines: [EMPTY_LINE] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  // Not filtered by is_sellable — a dispatch, like a rep's own request, may carry
  // any active product, sellable or not (frontend4.md §3, §6d).
  const { data: productsRes, isLoading: isLoadingProducts } = useProductsQuery();
  const productOptions = React.useMemo(
    () =>
      (productsRes?.data?.products ?? []).map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    [productsRes],
  );

  const { mutate, isPending } = useCreateStockTransferMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: DispatchStockTransferFormValues) => {
    setBanner(null);
    mutate(
      {
        rep: Number(values.rep),
        notes: values.notes || undefined,
        lines: values.lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: l.quantity,
        })),
      },
      {
        onSuccess: () => onOpenChange(false),
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
                إرسال بضاعة لمندوب
              </DrawerTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "جارٍ الإرسال..." : "إرسال"}
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
                هذه بضاعة يرسلها المكتب دون أن يطلبها المندوب — تدخل مباشرة بحالة
                "موافَق عليه" ولا تنتقل فعلياً إلى الفان إلا بعد أن يستلمها. لا
                يوجد تراجع بعد الإرسال، وإرسال النموذج مرتين ينشئ طلبين منفصلين
                — تجنّب الضغط على الزر أكثر من مرة.
              </p>

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
                        placeholder="اختر مندوباً"
                        searchPlaceholder="ابحث عن مندوب..."
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
                        render={({ field: productField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <SearchableSelect
                                options={productOptions}
                                value={productField.value}
                                onChange={productField.onChange}
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
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...qtyField}
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
  );
}
