"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { ProductFormValues } from "../schema";
import { useCategoriesQuery, useUnitsQuery } from "../hook";

interface ProductBasicInfoTabProps {
  isLoading?: boolean;
}

export const ProductBasicInfoTab = ({
  isLoading = false,
}: ProductBasicInfoTabProps) => {
  const { control } = useFormContext<ProductFormValues>();

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right block">اسم المنتج</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="أدخل اسم المنتج"
                className="text-right h-12"
              />
            </FormControl>
            <FormDescription className="text-right">
              الاسم الذي سيظهر للعملاء عند تصفح المنتج
            </FormDescription>
            <FormMessage className="text-right" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right block">الوصف</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="وصف مختصر للمنتج"
                className="text-right min-h-24"
              />
            </FormControl>
            <FormDescription className="text-right">
              وصف مختصر يساعد العميل على فهم المنتج بشكل أفضل
            </FormDescription>
            <FormMessage className="text-right" />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">SKU</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="DELL-XPS-15"
                  dir="ltr"
                  className="h-12"
                />
              </FormControl>
              <FormDescription className="text-right">
                رمز تعريفي فريد لتتبع المنتج داخل المخزون
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">الباركود</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="1234567890123"
                  dir="ltr"
                  className="h-12"
                />
              </FormControl>
              <FormDescription className="text-right">
                رقم الباركود المطبوع على عبوة المنتج إن وجد
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">
                العلامة التجارية
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Dell" className="h-12" />
              </FormControl>
              <FormDescription className="text-right">
                اسم الشركة المصنعة أو الماركة التجارية للمنتج
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">التصنيف</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={categoryOptions}
                  value={field.value ? String(field.value) : undefined}
                  onChange={(v) => field.onChange(Number(v))}
                  placeholder="اختر التصنيف"
                  loading={loadingCategories}
                />
              </FormControl>
              <FormDescription className="text-right">
                التصنيف الذي ينتمي إليه المنتج ضمن كتالوج المتجر
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right block">وحدة القياس</FormLabel>
            <FormControl>
              <SearchableSelect
                options={unitOptions}
                value={field.value ? String(field.value) : undefined}
                onChange={(v) => field.onChange(Number(v))}
                placeholder="اختر وحدة القياس"
                loading={loadingUnits}
              />
            </FormControl>
            <FormDescription className="text-right">
              الوحدة المستخدمة لبيع وقياس كمية هذا المنتج
            </FormDescription>
            <FormMessage className="text-right" />
          </FormItem>
        )}
      />
    </div>
  );
};
