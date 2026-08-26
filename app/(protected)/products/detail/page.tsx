"use client";

import { useParams } from "next/navigation";
import { useProductQuery } from "@/module/products/hook";
import { ProductFormClient } from "@/module/products/components/product-form-client";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useProductQuery(id);
  const product = data?.data?.product;

  return (
    <ProductFormClient mode="edit" product={product} isLoading={isLoading} />
  );
}
