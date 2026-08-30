"use client";

import { useSearchParams } from "next/navigation";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { WarehouseDetailClient } from "@/module/warehouses/_components/warehouse-detail-client";

export default function WarehouseDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="invoices">
      <WarehouseDetailClient warehouseId={id} />
    </PermissionGate>
  );
}
