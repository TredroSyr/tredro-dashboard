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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { ProductFormValues } from "../schema";

interface ProductDetailsTabProps {
  isLoading?: boolean;
}

export const ProductDetailsTab = ({
  isLoading = false,
}: ProductDetailsTabProps) => {
  const { control, watch } = useFormContext<ProductFormValues>();
  const isTaxable = watch("is_taxable");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">الوزن</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="2.500"
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                  type="number"
                  min={0}
                />
              </FormControl>
              <FormDescription className="text-right">
                وزن الوحدة الواحدة من المنتج، يستخدم في حساب تكاليف الشحن
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="weight_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">وحدة الوزن</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="kg"
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                />
              </FormControl>
              <FormDescription className="text-right">
                الوحدة المستخدمة لقياس وزن المنتج مثل كجم أو جرام
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <FormField
          control={control}
          name="length"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">الطول</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                  type="number"
                  min={0}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="width"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">العرض</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                  type="number"
                  min={0}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">الارتفاع</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                  type="number"
                  min={0}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="dimension_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">وحدة القياس</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="cm"
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                />
              </FormControl>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right -mt-3">
        أبعاد المنتج تساعد في حساب مساحة التخزين وتكلفة الشحن بدقة
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="reorder_point"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">حد إعادة الطلب</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  dir="ltr"
                  className="h-12"
                  isLoading={isLoading}
                  type="number"
                  min={0}
                />
              </FormControl>
              <FormDescription className="text-right">
                الكمية التي عند الوصول إليها يجب إعادة طلب المنتج
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="reorder_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">
                كمية إعادة الطلب
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  dir="ltr"
                  className="h-12"
                  type="number"
                  min={0}
                  isLoading={isLoading}
                />
              </FormControl>
              <FormDescription className="text-right">
                الكمية المقترحة لطلبها من المورد عند نفاد المخزون
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="is_taxable"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="flex flex-col gap-1">
              <Label>خاضع للضريبة</Label>
              <FormDescription>
                فعّل هذا الخيار إذا كان يجب إضافة ضريبة على سعر المنتج
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                isLoading={isLoading}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isTaxable && (
        <FormField
          control={control}
          name="tax_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-right block">
                نسبة الضريبة (%)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="10.00"
                  dir="ltr"
                  isLoading={isLoading}
                  className="h-12"
                  type="number"
                  min={0}
                  max={100}
                />
              </FormControl>
              <FormDescription className="text-right">
                النسبة المئوية للضريبة التي تضاف على سعر المنتج
              </FormDescription>
              <FormMessage className="text-right" />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="external_reference"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right block">المرجع الخارجي</FormLabel>
            <FormControl>
              <Input {...field} dir="ltr" className="h-12" />
            </FormControl>
            <FormDescription className="text-right">
              رقم أو كود مرجعي مرتبط بنظام خارجي مثل نظام المحاسبة أو المورد
            </FormDescription>
            <FormMessage className="text-right" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right block">ملاحظات</FormLabel>
            <FormControl>
              <Textarea {...field} className="text-right min-h-24" />
            </FormControl>
            <FormDescription className="text-right">
              أي ملاحظات داخلية إضافية خاصة بالمنتج، لا تظهر للعميل
            </FormDescription>
            <FormMessage className="text-right" />
          </FormItem>
        )}
      />
    </div>
  );
};
