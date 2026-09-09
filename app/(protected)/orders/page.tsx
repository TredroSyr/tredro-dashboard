"use client";

import { OrdersView } from "@/module/orders/_components/orders-view";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function OrdersPage() {
  return (
    <PermissionGate module="customer_requests">
      <OrdersView />
    </PermissionGate>
  );
}
