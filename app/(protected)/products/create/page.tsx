"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import { ProductFormClient } from "@/module/products/components/product-form-client";

export default function CreateProductPage() {
  return (
    <PermissionGate module="products" requireAction>
      <ProductFormClient mode="create" />
    </PermissionGate>
  );
}
