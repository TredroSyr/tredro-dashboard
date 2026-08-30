"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import StockTransfersView from "@/module/stock-transfers/_components/stock-transfers-view";

export default function StockTransfersPage() {
  return (
    <PermissionGate module="invoices">
      <StockTransfersView />
    </PermissionGate>
  );
}
