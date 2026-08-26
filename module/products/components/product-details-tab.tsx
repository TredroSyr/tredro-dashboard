"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductFormValues } from "../schema";

export const ProductDetailsTab = () => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const isTaxable = watch("is_taxable");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-right block">الوزن</Label>
          <Input
            {...register("weight")}
            placeholder="2.500"
            dir="ltr"
            className="h-12"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">وحدة الوزن</Label>
          <Input
            {...register("weight_unit")}
            placeholder="kg"
            dir="ltr"
            className="h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-right block">الطول</Label>
          <Input {...register("length")} dir="ltr" className="h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">العرض</Label>
          <Input {...register("width")} dir="ltr" className="h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">الارتفاع</Label>
          <Input {...register("height")} dir="ltr" className="h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">وحدة القياس</Label>
          <Input
            {...register("dimension_unit")}
            placeholder="cm"
            dir="ltr"
            className="h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-right block">حد إعادة الطلب</Label>
          <Input {...register("reorder_point")} dir="ltr" className="h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-right block">كمية إعادة الطلب</Label>
          <Input {...register("reorder_quantity")} dir="ltr" className="h-12" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label>خاضع للضريبة</Label>
        <Controller
          control={control}
          name="is_taxable"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {isTaxable && (
        <div className="flex flex-col gap-2">
          <Label className="text-right block">نسبة الضريبة (%)</Label>
          <Input
            {...register("tax_rate")}
            placeholder="10.00"
            dir="ltr"
            className="h-12"
          />
          {errors.tax_rate && (
            <p className="text-xs text-destructive text-right">
              {errors.tax_rate.message}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="text-right block">المرجع الخارجي</Label>
        <Input {...register("external_reference")} dir="ltr" className="h-12" />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-right block">ملاحظات</Label>
        <Textarea {...register("notes")} className="text-right min-h-24" />
      </div>
    </div>
  );
};
