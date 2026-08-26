"use client";

import { useSearchParams } from "next/navigation";
import { useProductQuery } from "@/module/products/hook";
import { ProductFormClient } from "@/module/products/components/product-form-client";

export default function EditProductPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { data, isLoading } = useProductQuery(id ?? undefined);
  const product = data?.data?.product;

  return (
    <ProductFormClient mode="edit" product={product} isLoading={isLoading} />
  );
}
