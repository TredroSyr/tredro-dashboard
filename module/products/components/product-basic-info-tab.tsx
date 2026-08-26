"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { ProductFormValues } from "../schema";
import { useCategoriesQuery, useUnitsQuery } from "../hook";

export const ProductBasicInfoTab = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const { data: categoriesRes, isLoading: loadingCategories } =
    useCategoriesQuery();
  const { data: unitsRes, isLoading: loadingUnits } = useUnitsQuery();

  const categories = categoriesRes?.data?.categories ?? [];
  const units = unitsRes?.data?.units ?? [];

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  const unitOptions = units.map((u) => ({
    value: String(u.id),
    label: `${u.name} (${u.code})`,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="text-right block">اسم المنتج</Label>
        <Input
          {...register("name")}
          placeholder="أدخل اسم المنتج"
          className="text-right h-12"
        />
        {errors.name && (
          <p className="text-xs text-destructive text-right">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-right block">الوصف</Label>
        <Textarea
          {...register("description")}
          placeholder="وصف مختصر للمنتج"
          className="text-right min-h-24"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-right block">SKU</Label>
          <Input
            {...register("sku")}
            placeholder="DELL-XPS-15"
            dir="ltr"
            className="h-12"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">الباركود</Label>
          <Input
            {...register("barcode")}
            placeholder="1234567890123"
            dir="ltr"
            className="h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-right block">العلامة التجارية</Label>
          <Input {...register("brand")} placeholder="Dell" className="h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">التصنيف</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SearchableSelect
                options={categoryOptions}
                value={field.value ? String(field.value) : undefined}
                onChange={(v) => field.onChange(Number(v))}
                placeholder="اختر التصنيف"
                loading={loadingCategories}
              />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-right block">وحدة القياس</Label>
        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <SearchableSelect
              options={unitOptions}
              value={field.value ? String(field.value) : undefined}
              onChange={(v) => field.onChange(Number(v))}
              placeholder="اختر وحدة القياس"
              loading={loadingUnits}
            />
          )}
        />
        {errors.unit && (
          <p className="text-xs text-destructive text-right">
            {errors.unit.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>مفعّل</Label>
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>قابل للبيع</Label>
          <Controller
            control={control}
            name="is_sellable"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>قابل للشراء</Label>
          <Controller
            control={control}
            name="is_purchasable"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </div>
  );
};
