"use client";
import { PdfExportButton } from "@/components/tredro/pdf/pdf-export-button";
import type { Customer, CustomerOverviewParams } from "../types";
import { fetchCustomerPdfData } from "../lib/customer-pdf-data";
import { CustomerProfilePdfDocument } from "./customer-profile-pdf-document";

interface CustomerPdfDownloadButtonProps {
  customer: Customer;
  /** The period + currency picked in the header, so the PDF matches what's on screen. */
  params: CustomerOverviewParams;
}

export function CustomerPdfDownloadButton({ customer, params }: CustomerPdfDownloadButtonProps) {
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
