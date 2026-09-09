"use client";
import { useSearchParams } from "next/navigation";
import { OrderDetailClient } from "@/module/orders/_components/order-detail-client";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="customer_requests">
      <OrderDetailClient requestId={id} />
    </PermissionGate>
  );
}
