"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import WarehousesView from "@/module/warehouses/_components/warehouses-view";

export default function WarehousesPage() {
  return (
    <PermissionGate module="invoices">
      <WarehousesView />
    </PermissionGate>
  );
}
