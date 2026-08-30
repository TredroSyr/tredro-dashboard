"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { warehouseFormSchema, type WarehouseFormValues } from "../schema";
import {
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
} from "../hooks";
import type { Warehouse, WarehouseOwnerType } from "../types";

const OWNER_TYPE_OPTIONS: { value: WarehouseOwnerType; label: string }[] = [
  { value: "company", label: "مستودع الشركة" },
  { value: "rep", label: "فان مندوب" },
];

export function WarehouseFormDialog({
  warehouse,
  open,
  onOpenChange,
  onCreated,
  lockOwnerType,
  lockRep,
}: {
  warehouse: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new warehouse after a successful create (not on edit). */
  onCreated?: (warehouse: Warehouse) => void;
  /** Hide the type picker and force this type — e.g. the company-only warehouses screen. */
  lockOwnerType?: WarehouseOwnerType;
  /** Hide the rep picker and force this rep — e.g. "add a van" from a rep's own page. */
  lockRep?: number;
}) {
  const mode = warehouse ? "edit" : "create";

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      address: "",
      kind: "",
      owner_type: lockOwnerType ?? "company",
      rep: lockRep ? String(lockRep) : "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (warehouse) {
      form.reset({
        name: warehouse.name,
        address: warehouse.address,
        kind: warehouse.kind,
        owner_type: lockOwnerType ?? warehouse.owner_type,
        rep: lockRep ? String(lockRep) : warehouse.rep ? String(warehouse.rep) : "",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        kind: "",
        owner_type: lockOwnerType ?? "company",
        rep: lockRep ? String(lockRep) : "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warehouse?.id]);

  const ownerType = form.watch("owner_type");

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const { mutate: createWarehouse, isPending: isCreating } =
    useCreateWarehouseMutation();
  const { mutate: updateWarehouse, isPending: isUpdating } =
    useUpdateWarehouseMutation();
  const isPending = isCreating || isUpdating;

  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: WarehouseFormValues) => {
    setBanner(null);
    const payload = {
      name: values.name,
      address: values.address || undefined,
      kind: values.kind || undefined,
      owner_type: values.owner_type,
      rep: values.owner_type === "rep" ? Number(values.rep) : null,
    };

    if (mode === "edit" && warehouse) {
      updateWarehouse(
        { id: warehouse.id, ...payload },
        {
          onSuccess: () => onOpenChange(false),
          onError: (error) => setBanner(handleApiError(error).message),
        },
      );
      return;
    }

    createWarehouse(payload, {
      onSuccess: (res) => {
        onOpenChange(false);
        onCreated?.(res.data.warehouse);
      },
      onError: (error) => setBanner(handleApiError(error).message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "مستودع جديد" : `تعديل — ${warehouse?.name}`}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {banner && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {banner}
              </p>
            )}

            {!lockOwnerType && (
              <FormField
                control={form.control}
                name="owner_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المستودع</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        hideSearch
                        options={OWNER_TYPE_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {ownerType === "rep" && !lockRep && (
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
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستودع</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: المستودع الرئيسي" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان (اختياري)</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تصنيف (اختياري)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: مستودع تبريد" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جارٍ الحفظ..." : mode === "create" ? "إضافة المستودع" : "حفظ التعديلات"}
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
