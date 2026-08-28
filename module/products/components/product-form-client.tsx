"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import {
  CreateProductPayload,
  ProductDetail,
  ProductImagePayload,
  ProductPricePayload,
} from "../types";
import { getVisibleTabs, ProductTabValue } from "../constant";
import { productFormSchema, ProductFormValues } from "../schema";
import { getProductFormDefaultValues } from "../schema/product-form-defaults";
import { useCreateProductMutation, useUpdateProductMutation } from "../hook";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import { ProductFormHeader } from "./product-form-header";
import { ProductDetailTabs } from "./product-detail-tabs";
import { ProductBasicInfoTab } from "./product-basic-info-tab";
import { ProductDetailsTab } from "./product-details-tab";
import { ProductCustomFieldsTab } from "./product-custom-fields-tab";
import { ProductPricingTab } from "./product-pricing-tab";
import { ProductImagesTab } from "./product-images-tab";
import { ProductReviewTab } from "./product-review-tab";
import ProductOverview from "./product-overview";

interface ProductFormClientProps {
  mode: "create" | "edit";
  product?: ProductDetail;
  isLoading?: boolean;
}

export const ProductFormClient = ({
  mode,
  product,
  isLoading = false,
}: ProductFormClientProps) => {
  const router = useRouter();
  const visibleTabs = getVisibleTabs(mode);
  const [activeTab, setActiveTab] = React.useState<ProductTabValue>(
    visibleTabs[0].value,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductFormDefaultValues(product),
  });

  React.useEffect(() => {
    if (product) form.reset(getProductFormDefaultValues(product));
  }, [product]);
  console.log(form.formState.errors, "errors");
  const { mutateAsync: createProduct } = useCreateProductMutation();
  const { mutateAsync: updateProduct } = useUpdateProductMutation();
  const handleApiError = useApiFormErrorHandler(form);

  const goToFirstErrorTab = (errors: Record<string, unknown>) => {
    const tabWithError = visibleTabs.find((tab) =>
      tab.fields.some((field) => Boolean(errors[field])),
    );
    if (tabWithError) setActiveTab(tabWithError.value);
  };

  const buildImagesPayload = (
    values: ProductFormValues,
  ): ProductImagePayload[] => {
    let sortOrder = 0;
    return values.images
      .filter(
        (img) => Boolean(img.file) || Boolean(img.server_id) || Boolean(img.url),
      )
      .map((img) => ({
        id: img.server_id,
        file: img.file ?? undefined,
        url: img.file || img.server_id ? undefined : img.url,
        alt_text: img.alt_text || undefined,
        is_primary: img.is_primary,
        sort_order: sortOrder++,
      }));
  };

  // Prices: منرمي أي صف تسعير ناقص (بدون عملة أو بدون سعر) بدل ما
  // نبعته فاضي للباك اند ويرجع خطأ "This field is required.".
  const buildPricesPayload = (
    values: ProductFormValues,
  ): { prices: ProductPricePayload[]; invalidCount: number } => {
    const rawPrices = values.prices ?? [];

    const isRowValid = (price: (typeof rawPrices)[number]) =>
      price.currency !== undefined &&
      price.currency !== null &&
      (price.currency as unknown) !== "" &&
      price.price !== undefined &&
      price.price !== null &&
      (price.price as unknown) !== "";

    const validRows = rawPrices.filter(isRowValid);
    const invalidCount = rawPrices.length - validRows.length;

    const prices: ProductPricePayload[] = validRows.map((price) => ({
      currency: price.currency,
      price_type: price.price_type,
      customer_category: price.customer_category ?? undefined,
      price: price.price,
      is_default: price.is_default,
    }));

    return { prices, invalidCount };
  };

  const persist = async (values: ProductFormValues) => {
    const images = buildImagesPayload(values);
    const { prices, invalidCount } = buildPricesPayload(values);

    if (invalidCount > 0) {
      throw new Error(
        "في صف تسعير ناقص (بدون عملة أو سعر). تأكد من تعبئة كل صفوف التسعير أو احذف الصفوف الفارغة قبل الحفظ.",
      );
    }

    const payload: CreateProductPayload = {
      name: values.name.trim(),
      description: values.description || undefined,
      sku: values.sku || undefined,
      barcode: values.barcode || undefined,
      brand: values.brand || undefined,
      category: values.category,
      unit: values.unit,
      weight: values.weight || undefined,
      weight_unit: values.weight_unit || undefined,
      length: values.length || undefined,
      width: values.width || undefined,
      height: values.height || undefined,
      dimension_unit: values.dimension_unit || undefined,
      reorder_point: values.reorder_point || undefined,
      reorder_quantity: values.reorder_quantity || undefined,
      is_taxable: values.is_taxable,
      tax_rate: values.is_taxable ? values.tax_rate || undefined : undefined,
      is_sellable: values.is_sellable,
      is_purchasable: values.is_purchasable,
      external_reference: values.external_reference || undefined,
      notes: values.notes || undefined,
      is_active: values.is_active,
      status: values.status,
      custom_fields:
        Object.keys(values.custom_fields).length > 0
          ? values.custom_fields
          : undefined,
      images,
      prices,
    };

    if (mode === "edit" && product) {
      await updateProduct({ id: product.id, ...payload });
    } else {
      await createProduct(payload);
    }
  };

  const submitAs = async (published: boolean) => {
    form.setValue("status", published ? "published" : "draft");
    const values = form.getValues();
    values.status = published ? "published" : "draft";

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await persist(values);
      router.push("/products");
    } catch (err) {
      const { message, fields } = handleApiError(err);
      setSubmitError(message);

      if (fields.length > 0) {
        // خطأ حقول من الباك اند (مثلاً SKU مستخدم) — وجّه المستخدم للتاب المناسب
        goToFirstErrorTab(Object.fromEntries(fields.map((f) => [f, true])));
      } else if (err instanceof Error && err.message.includes("تسعير")) {
        // إذا الخطأ متعلق بالتسعير، وجّه المستخدم لتاب التسعير مباشرة
        setActiveTab("pricing" as ProductTabValue);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = form.handleSubmit(
    () => submitAs(false),
    (errors) => goToFirstErrorTab(errors),
  );

  const handlePublish = form.handleSubmit(
    () => submitAs(true),
    (errors) => goToFirstErrorTab(errors),
  );

  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedStatus = form.watch("status");
  const watchedImages = form.watch("images");
  const primaryImage =
    watchedImages.find((img) => img.is_primary) ?? watchedImages[0];

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4 ">
        <div className="sticky top-0 z-20 bg-card">
          <ProductFormHeader
            title={watchedName || (mode === "edit" ? "" : "إضافة منتج جديد")}
            description={watchedDescription}
            imageUrl={primaryImage?.previewUrl}
            status={watchedStatus}
            isEditMode={mode === "edit"}
            isSubmitting={isSubmitting}
            isLoading={isLoading}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />

          <ProductDetailTabs
            mode={mode}
            value={activeTab}
            onValueChange={setActiveTab}
            errors={form.formState.errors}
            pricesCount={form.watch("prices").length}
            imagesCount={form.watch("images").length}
          />
        </div>

        <div className="px-4 sm:px-6 pb-6">
          {submitError && (
            <p className="text-sm text-destructive text-right mb-4">
              {submitError}
            </p>
          )}

          <div className="rounded-md border border-border p-4 sm:p-6">
            {activeTab === "overview" && mode === "edit" && <ProductOverview />}
            {activeTab === "basic" && (
              <ProductBasicInfoTab isLoading={isLoading} />
            )}
            {activeTab === "details" && (
              <ProductDetailsTab isLoading={isLoading} />
            )}
            {activeTab === "custom-fields" && <ProductCustomFieldsTab />}
            {activeTab === "pricing" && <ProductPricingTab />}
            {activeTab === "images" && <ProductImagesTab />}
            {activeTab === "review" && <ProductReviewTab />}
          </div>
        </div>
      </div>
    </Form>
  );
};
