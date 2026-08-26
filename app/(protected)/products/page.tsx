"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import ProductsView from "@/module/products/components/products-view";

export default function ProductsPage() {
  return (
    <PermissionGate module="products">
      <ProductsView />
    </PermissionGate>
  );
}
