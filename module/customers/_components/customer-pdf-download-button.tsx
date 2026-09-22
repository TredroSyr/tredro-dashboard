"use client";
import { PdfExportButton } from "@/components/tredro/pdf/pdf-export-button";
import { usePermissions } from "@/components/provider/PermissionsProvider";
import type { Customer, CustomerOverviewParams } from "../types";
import { fetchCustomerPdfData } from "../lib/customer-pdf-data";
import { CustomerProfilePdfDocument } from "./customer-profile-pdf-document";

interface CustomerPdfDownloadButtonProps {
  customer: Customer;
  /** The period + currency picked in the header, so the PDF matches what's on screen. */
  params: CustomerOverviewParams;
}

export function CustomerPdfDownloadButton({ customer, params }: CustomerPdfDownloadButtonProps) {
  const { canView } = usePermissions();
  // fetchCustomerPdfData pulls invoices and orders regardless of which tabs
  // are visible — hide the export whenever any of that data is off-limits,
  // instead of letting the fetch 403 or leak data the tabs already hide.
  const canExport = canView("invoices") && canView("customer_requests");

  if (!canExport) return null;

  return (
    <PdfExportButton
      fileName={customer.name}
      fetchData={() => fetchCustomerPdfData(customer.id, params)}
      renderDocument={(data, company) => (
        <CustomerProfilePdfDocument customer={customer} data={data} company={company} />
      )}
    />
  );
}
