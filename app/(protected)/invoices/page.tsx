"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import InvoicesView from "@/module/invoices/_components/invoices-view";

export default function InvoicesPage() {
  return (
    <PermissionGate module="invoices">
      <InvoicesView />
    </PermissionGate>
  );
}
