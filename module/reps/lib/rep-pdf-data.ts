// ---- PDF profile export — real data, fetched when the export button is clicked ----
import { listCustomers } from "@/module/customers/api";
import type { Customer } from "@/module/customers/types";
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
import { getRepOverview } from "../api";
import type { RepOverview, RepOverviewParams } from "../types";

export function buildPdfKpis(overview: RepOverview): PdfKpi[] {
  const { sales, visits, customer_requests, customers, currency } = overview;
  return [
    {
      key: "assignedCustomers",
      icon: "users",
      label: "العملاء المسندون",
      value: String(customers.assigned.value),
      linkTo: "customers-table",
    },
    {
      key: "requests",
      icon: "cart",
      label: "الطلبات",
      value: String(customer_requests.count.value),
      linkTo: "orders-table",
    },
    {
      key: "sales",
      icon: "revenue",
      label: "قيمة المبيعات",
      value: formatPdfAmount(sales.total_amount.value),
      suffix: currency.code,
      linkTo: "invoices-table",
    },
    {
      key: "newCustomers",
      icon: "addUser",
      label: "عملاء جدد (عبر الإحالة)",
      value: String(customers.new_via_referral.value),
      linkTo: "customers-table",
    },
    {
      key: "awaitingDelivery",
      icon: "clock",
      label: "بانتظار التسليم",
      value: String(customer_requests.awaiting_delivery_count),
      linkTo: "orders-table",
    },
    {
      key: "visits",
      icon: "map",
      label: "الزيارات (آخر 7 أيام)",
      value: String(visits.count.value),
    },
  ];
}

export interface RepPdfData {
  overview: RepOverview;
  invoices: PdfTableData<SalesInvoice>;
  customers: PdfTableData<Customer>;
  orders: PdfTableData<CustomerRequest>;
}

/**
 * Everything the PDF shows. The overview goes first because its `period` (the server's default when
 * the user picked no range) is what the invoice table is then filtered by, so cards and table agree.
 */
export async function fetchRepPdfData(
  repId: number | string,
  params: RepOverviewParams,
): Promise<RepPdfData> {
  const overview = (await getRepOverview(repId, params)).data.overview;

  const [invoicesRes, customersRes, ordersRes] = await Promise.all([
    listSalesInvoices({
      rep: repId,
      date_from: toISODate(overview.period.date_from),
      date_to: toISODate(overview.period.date_to),
      page_size: PDF_TABLE_ROW_LIMIT,
    }),
    listCustomers(repId),
    listCustomerRequests({ rep: repId }),
  ]);

  const customers = customersRes.data.customers;
  const { invoices, pagination: invoicesPagination } = invoicesRes.data;
  const { requests, pagination: ordersPagination } = ordersRes.data;

  return {
    overview,
    invoices: { rows: invoices.slice(0, PDF_TABLE_ROW_LIMIT), total: invoicesPagination.count },
    customers: {
      rows: customers.slice(0, PDF_TABLE_ROW_LIMIT),
      total: customers.length,
    },
    orders: { rows: requests.slice(0, PDF_TABLE_ROW_LIMIT), total: ordersPagination.count },
  };
}
