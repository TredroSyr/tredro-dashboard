// ---- PDF profile export — real data, fetched when the export button is clicked ----
import { listSalesInvoices } from "@/module/invoices/api";
import type { SalesInvoice } from "@/module/invoices/types";
import { listCustomerRequests } from "@/module/orders/api";
import type { CustomerRequest } from "@/module/orders/types";
import {
  formatPdfAmount,
  PDF_TABLE_ROW_LIMIT,
  toISODate,
  type PdfKpi,
  type PdfTableData,
} from "@/components/tredro/pdf/pdf-utils";
import { getCustomerOverview } from "../api";
import type { CustomerOverview, CustomerOverviewParams } from "../types";

export function buildPdfKpis(overview: CustomerOverview): PdfKpi[] {
  const { purchases, customer_requests, reps, currency } = overview;
  return [
    {
      key: "requests",
      icon: "cart",
      label: "الطلبات",
      value: String(customer_requests.count.value),
      linkTo: "orders-table",
    },
    {
      key: "purchases",
      icon: "revenue",
      label: "إجمالي المشتريات",
      value: formatPdfAmount(purchases.total_amount.value),
      suffix: currency.code,
      linkTo: "invoices-table",
    },
    {
      key: "lastPurchase",
      icon: "clock",
      label: "آخر عملية شراء",
      value: purchases.last_invoice_at ? toISODate(purchases.last_invoice_at) : "—",
      linkTo: "invoices-table",
    },
    {
      key: "avgOrder",
      icon: "revenue",
      label: "متوسط الطلبية",
      value: formatPdfAmount(purchases.average_amount.value),
      suffix: currency.code,
    },
    {
      key: "totalRequests",
      icon: "cart",
      label: "إجمالي الطلبات (كل الوقت)",
      value: String(customer_requests.total_count),
      linkTo: "orders-table",
    },
    {
      key: "assignedReps",
      icon: "users",
      label: "المندوبون المسندون",
      value: String(reps.assigned.value),
      linkTo: "reps-table",
    },
  ];
}

export interface CustomerPdfData {
  overview: CustomerOverview;
  invoices: PdfTableData<SalesInvoice>;
  orders: PdfTableData<CustomerRequest>;
}

/**
 * Everything the PDF fetches. The overview goes first because its `period` (the server's default when
 * the user picked no range) is what the invoice table is then filtered by, so cards and table agree.
 * The assigned-reps table comes from the customer record the page already has.
 */
export async function fetchCustomerPdfData(
  customerId: number | string,
  params: CustomerOverviewParams,
): Promise<CustomerPdfData> {
  const overview = (await getCustomerOverview(customerId, params)).data.overview;

  const [invoicesRes, ordersRes] = await Promise.all([
    listSalesInvoices({
      customer: customerId,
      date_from: toISODate(overview.period.date_from),
      date_to: toISODate(overview.period.date_to),
      page_size: PDF_TABLE_ROW_LIMIT,
    }),
    listCustomerRequests({ customer: customerId }),
  ]);

  const { invoices, pagination: invoicesPagination } = invoicesRes.data;
  const { requests, pagination: ordersPagination } = ordersRes.data;

  return {
    overview,
    invoices: { rows: invoices.slice(0, PDF_TABLE_ROW_LIMIT), total: invoicesPagination.count },
    orders: { rows: requests.slice(0, PDF_TABLE_ROW_LIMIT), total: ordersPagination.count },
  };
}
