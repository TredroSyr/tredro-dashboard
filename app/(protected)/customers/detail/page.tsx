"use client";
import { useSearchParams } from "next/navigation";
import { CustomerDetailClient } from "@/module/customers/_components/customer-detail-client";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function CustomerDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="customers">
      <CustomerDetailClient customerId={id} />
    </PermissionGate>
  );
}
