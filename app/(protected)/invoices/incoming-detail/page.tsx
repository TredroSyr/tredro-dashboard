"use client";

import { useSearchParams } from "next/navigation";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { IncomingInvoiceDetailClient } from "@/module/invoices/_components/incoming-invoice-detail-client";

export default function IncomingInvoiceDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="invoices">
      <IncomingInvoiceDetailClient invoiceId={id} />
    </PermissionGate>
  );
}
