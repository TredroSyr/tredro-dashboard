"use client";

import { useSearchParams } from "next/navigation";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { InvoiceDetailClient } from "@/module/invoices/_components/invoice-detail-client";

export default function InvoiceDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="invoices">
      <InvoiceDetailClient invoiceId={id} />
    </PermissionGate>
  );
}
