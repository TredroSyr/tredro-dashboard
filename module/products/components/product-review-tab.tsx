"use client";

import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { ProductFormValues } from "../schema";
import { useCategoriesQuery, useCurrenciesQuery, useUnitsQuery } from "../hook";

export const ProductReviewTab = () => {
  const { watch } = useFormContext<ProductFormValues>();
  const values = watch();

  const { data: categoriesRes } = useCategoriesQuery();
  const { data: unitsRes } = useUnitsQuery();
  const { data: currenciesRes } = useCurrenciesQuery();

  const categoryName = categoriesRes?.data?.categories.find(
    (c) => c.id === values.category,
  )?.name;
  const unitName = unitsRes?.data?.units.find(
    (u) => u.id === values.unit,
  )?.name;
  const currencies = currenciesRes?.data?.currencies ?? [];

  const sections = [
    {
      title: "البيانات الأساسية",
      rows: [
        { label: "الاسم", value: values.name },
        { label: "الوصف", value: values.description },
        { label: "SKU", value: values.sku },
        { label: "الباركود", value: values.barcode },
        { label: "العلامة التجارية", value: values.brand },
        { label: "التصنيف", value: categoryName },
        { label: "الوحدة", value: unitName },
      ],
    },
    {
      title: "التفاصيل والأبعاد",
      rows: [
        {
          label: "الوزن",
          value: values.weight
            ? `${values.weight} ${values.weight_unit}`
            : undefined,
        },
        {
          label: "الأبعاد",
          value:
            values.length || values.width || values.height
              ? `${values.length || "-"} × ${values.width || "-"} × ${
                  values.height || "-"
                } ${values.dimension_unit}`
              : undefined,
        },
        { label: "حد إعادة الطلب", value: values.reorder_point },
        { label: "كمية إعادة الطلب", value: values.reorder_quantity },
        { label: "خاضع للضريبة", value: values.is_taxable ? "نعم" : "لا" },
        {
          label: "نسبة الضريبة",
          value: values.is_taxable ? values.tax_rate : undefined,
        },
        { label: "مرجع خارجي", value: values.external_reference },
        { label: "ملاحظات", value: values.notes },
      ],
    },
    {
      title: "حالة العرض",
      rows: [
        { label: "قابل للبيع", value: values.is_sellable ? "نعم" : "لا" },
        { label: "قابل للشراء", value: values.is_purchasable ? "نعم" : "لا" },
        { label: "الحالة", value: values.is_active ? "منشور" : "مسودة" },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-6">
        {sections.map((section, sIndex) => (
          <div
            key={section.title}
            className="flex flex-col gap-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both"
            style={{ animationDelay: `${sIndex * 80}ms` }}
          >
            <p className="font-medium text-right">{section.title}</p>
            {section.rows.map((row) => (
              <ReviewRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        ))}

        <div
          className="flex flex-col gap-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: "240ms" }}
        >
          <p className="font-medium text-right">
            الأسعار ({values.prices.length})
          </p>
          {values.prices.length === 0 ? (
            <p className="text-muted-foreground text-right">
              لم تتم إضافة أسعار
            </p>
          ) : (
            values.prices.map((price) => {
              const currency = currencies.find((c) => c.id === price.currency);
              return (
                <div
                  key={price._localId}
                  className="flex items-center justify-between border-b border-border pb-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    {price.is_default && (
                      <Badge variant="secondary">افتراضي</Badge>
                    )}
                  </span>
                  <span className="font-medium" dir="ltr">
                    {currency?.symbol}
                    {price.price}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div
          className="flex flex-col gap-3 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: "320ms" }}
        >
          <p className="font-medium text-right">
            الحقول المخصصة ({Object.keys(values.custom_fields).length})
          </p>
          {Object.entries(values.custom_fields).length === 0 ? (
            <p className="text-muted-foreground text-right">
              لا توجد حقول مخصصة
            </p>
          ) : (
            Object.entries(values.custom_fields).map(([key, value]) => (
              <ReviewRow key={key} label={key} value={value} />
            ))
          )}
        </div>
      </div>

      <div
        className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both"
        style={{ animationDelay: "160ms" }}
      >
        <p className="font-medium text-right text-sm">
          الصور ({values.images.length})
        </p>
        {values.images.length === 0 ? (
          <p className="text-sm text-muted-foreground text-right">
            لم تتم إضافة صور
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {values.images.map((image, index) => (
              <div
                key={image._localId}
                className="relative rounded-md border border-border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500 fill-mode-both"
                style={{ animationDelay: `${360 + index * 60}ms` }}
              >
                <img
                  src={image.previewUrl}
                  alt=""
                  className="w-full h-24 object-cover"
                />
                {image.is_primary && (
                  <Badge className="absolute top-1 right-1">رئيسية</Badge>
                )}
              </div>
            ))}
          </div>
        )}
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
