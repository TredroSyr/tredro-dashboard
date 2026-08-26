"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProductPayload, ProductDetail } from "../types";
import { PRODUCT_TABS, ProductTabValue } from "../constant";
import { productFormSchema, ProductFormValues } from "../schema";
import { getProductFormDefaultValues } from "../schema/product-form-defaults";
import {
  useCreateProductMutation,
  useCreateProductPriceMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from "../hook";
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
  const [activeTab, setActiveTab] = React.useState<ProductTabValue>("basic");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductFormDefaultValues(product),
  });

  React.useEffect(() => {
    if (product) form.reset(getProductFormDefaultValues(product));
  }, [product]);

  const { mutateAsync: createProduct } = useCreateProductMutation();
  const { mutateAsync: createPrice } = useCreateProductPriceMutation();
  const { mutateAsync: updateProduct } = useUpdateProductMutation();
  //   const { mutateAsync: updatePrice } = useUpdateProductPriceMutation();
  //   const { mutateAsync: deletePrice } = useDeleteProductPriceMutation();
  const { mutateAsync: uploadImage } = useUploadProductImageMutation();

  const goToFirstErrorTab = (errors: Record<string, unknown>) => {
    const tabWithError = PRODUCT_TABS.find((tab) =>
      tab.fields.some((field) => Boolean(errors[field])),
    );
    if (tabWithError) setActiveTab(tabWithError.value);
  };

  const persist = async (values: ProductFormValues) => {
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
    };

    const productId =
      mode === "edit" && product
        ? (await updateProduct({ productId: product.id, payload })).data.product
            .id
        : (await createProduct(payload)).data.product.id;

    const existingPriceIds = new Set(product?.prices?.map((p) => p.id) ?? []);
    const currentPriceIds = new Set(
      values.prices.map((p) => p.id).filter((id): id is number => Boolean(id)),
    );

    for (const price of values.prices) {
      const pricePayload = {
        currency: price.currency,
        price_type: price.price_type,
        customer_category: price.customer_category,
        price: price.price,
        is_default: price.is_default,
      };
      //   if (price.id) {
      //     await updatePrice({
      //       productId,
      //       priceId: price.id,
      //       payload: pricePayload,
      //     });
      //   } else {
      //     await createPrice({ productId, payload: pricePayload });
      //   }
    }

    // for (const id of existingPriceIds) {
    //   if (!currentPriceIds.has(id)) {
    //     await deletePrice({ productId, priceId: id });
    //   }
    // }

    let sortOrder = 0;
    for (const img of values.images) {
      if (!img.file) {
        sortOrder++;
        continue;
      }
      await uploadImage({
        productId,
        file: img.file,
        meta: {
          alt_text: img.alt_text || undefined,
          is_primary: img.is_primary,
          sort_order: sortOrder++,
        },
      });
    }
  };

  const submitAs = async (status: "draft" | "published") => {
    form.setValue("status", status);
    const values = form.getValues();
    values.status = status;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await persist(values);
      router.push("/products");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ المنتج، حاول مرة أخرى",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = form.handleSubmit(
    () => submitAs("draft"),
    (errors) => goToFirstErrorTab(errors),
  );

  const handlePublish = form.handleSubmit(
    () => submitAs("published"),
    (errors) => goToFirstErrorTab(errors),
  );

  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedStatus = form.watch("status");
  const watchedImages = form.watch("images");
  const primaryImage =
    watchedImages.find((img) => img.is_primary) ?? watchedImages[0];

  return (
    <FormProvider {...form}>
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
            {activeTab === "overview" && <ProductOverview />}
            {activeTab === "basic" && <ProductBasicInfoTab />}
            {activeTab === "details" && <ProductDetailsTab />}
            {activeTab === "custom-fields" && <ProductCustomFieldsTab />}
            {activeTab === "pricing" && <ProductPricingTab />}
            {activeTab === "images" && <ProductImagesTab />}
            {activeTab === "review" && <ProductReviewTab />}
          </div>
        </div>
      </div>
    </FormProvider>
  );
};
