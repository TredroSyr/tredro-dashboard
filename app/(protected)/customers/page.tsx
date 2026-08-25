// app/(protected)/customers/page.tsx
"use client";

import CustomersView from "@/module/customers/_components/customers-view";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function CustomersPage() {
  return (
    <PermissionGate module="customers">
      <CustomersView />
    </PermissionGate>
  );
}
