"use client";

import { useSearchParams } from "next/navigation";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { TransferDetailClient } from "@/module/stock-transfers/_components/transfer-detail-client";

export default function StockTransferDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="invoices">
      <TransferDetailClient transferId={id} />
    </PermissionGate>
  );
}
