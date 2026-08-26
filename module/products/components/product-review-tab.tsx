"use client";

import { useFormContext } from "react-hook-form";

import { ProductFormValues } from "../schema";
import { useCategoriesQuery, useUnitsQuery } from "../hook";

export const ProductReviewTab = () => {
  const { watch } = useFormContext<ProductFormValues>();
  const values = watch();

  const { data: categoriesRes } = useCategoriesQuery();
  const { data: unitsRes } = useUnitsQuery();

  const categoryName = categoriesRes?.data?.categories.find(
    (c) => c.id === values.category,
  )?.name;
  const unitName = unitsRes?.data?.units.find(
    (u) => u.id === values.unit,
  )?.name;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-3 text-sm">
        <p className="font-medium text-right">ملخص البيانات</p>
        <ReviewRow label="الاسم" value={values.name} />
        <ReviewRow label="SKU" value={values.sku} />
        <ReviewRow label="التصنيف" value={categoryName} />
        <ReviewRow label="الوحدة" value={unitName} />
        <ReviewRow label="عدد الأسعار" value={String(values.prices.length)} />
        <ReviewRow label="عدد الصور" value={String(values.images.length)} />
        <ReviewRow
          label="الحقول المخصصة"
          value={String(Object.keys(values.custom_fields).length)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium text-right text-sm">معاينة</p>
        {/* <ProductPreview
          state={values}
          categoryName={categoryName}
          unitName={unitName}
        /> */}
      </div>
    </div>
  );
};

const ReviewRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-center justify-between border-b border-border pb-1.5">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value || "-"}</span>
  </div>
);
