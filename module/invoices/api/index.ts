import api from "@/lib/axios";
import {
  ListSalesInvoicesParams,
  SalesInvoicesListResponse,
  SalesInvoiceResponse,
  RecordPaymentPayload,
  RecordPaymentResponse,
  ListIncomingInvoicesParams,
  IncomingInvoicesListResponse,
  IncomingInvoiceResponse,
  CreateIncomingInvoicePayload,
  ListReturnInvoicesParams,
  ReturnInvoicesListResponse,
  ReturnInvoiceResponse,
  CreateReturnInvoicePayload,
  IssueReturnInvoicePayload,
  IssueReturnInvoiceResponse,
  ListCustomerCreditsParams,
  CustomerCreditsListResponse,
  ApiEnvelope,
  ListPaymentsParams,
  PaymentsListResponse,
  OverdueReportParams,
  OverdueReportResponse,
  InvoiceSettingsResponse,
  UpdateInvoiceSettingsPayload,
  HistoryResponse,
  ListWarehousesParams,
  WarehousesListResponse,
  CreateWarehousePayload,
  WarehouseResponse,
} from "../types";

// ---- Sales invoices ----
export const listSalesInvoices = async (
  params?: ListSalesInvoicesParams,
): Promise<SalesInvoicesListResponse> =>
  (await api.get("companies/sales-invoices/", { params })).data;

export const getSalesInvoice = async (
  id: number | string,
): Promise<SalesInvoiceResponse> =>
  (await api.get(`companies/sales-invoices/${id}/`)).data;

export const getSalesInvoiceHistory = async (
  id: number | string,
): Promise<HistoryResponse> =>
  (await api.get(`companies/sales-invoices/${id}/history/`)).data;

export const recordPayment = async (
  invoiceId: number | string,
  payload: RecordPaymentPayload,
): Promise<RecordPaymentResponse> =>
  (await api.post(`companies/sales-invoices/${invoiceId}/payments/`, payload))
    .data;

// ---- Incoming invoices ----
export const listIncomingInvoices = async (
  params?: ListIncomingInvoicesParams,
): Promise<IncomingInvoicesListResponse> =>
  (await api.get("companies/incoming-invoices/", { params })).data;

export const getIncomingInvoice = async (
  id: number | string,
): Promise<IncomingInvoiceResponse> =>
  (await api.get(`companies/incoming-invoices/${id}/`)).data;

export const createIncomingInvoice = async (
  payload: CreateIncomingInvoicePayload,
): Promise<IncomingInvoiceResponse> =>
  (await api.post("companies/incoming-invoices/", payload)).data;

export const issueIncomingInvoice = async (
  id: number | string,
): Promise<IncomingInvoiceResponse> =>
  (await api.post(`companies/incoming-invoices/${id}/issue/`)).data;

export const cancelIncomingInvoice = async (
  id: number | string,
): Promise<IncomingInvoiceResponse> =>
  (await api.post(`companies/incoming-invoices/${id}/cancel/`)).data;

export const getIncomingInvoiceHistory = async (
  id: number | string,
): Promise<HistoryResponse> =>
  (await api.get(`companies/incoming-invoices/${id}/history/`)).data;

// ---- Return invoices ----
export const listReturnInvoices = async (
  params?: ListReturnInvoicesParams,
): Promise<ReturnInvoicesListResponse> =>
  (await api.get("companies/return-invoices/", { params })).data;

export const getReturnInvoice = async (
  id: number | string,
): Promise<ReturnInvoiceResponse> =>
  (await api.get(`companies/return-invoices/${id}/`)).data;

export const createReturnInvoice = async (
  payload: CreateReturnInvoicePayload,
): Promise<ReturnInvoiceResponse> =>
  (await api.post("companies/return-invoices/", payload)).data;

export const issueReturnInvoice = async (
  id: number | string,
  payload?: IssueReturnInvoicePayload,
): Promise<IssueReturnInvoiceResponse> =>
  (await api.post(`companies/return-invoices/${id}/issue/`, payload ?? {}))
    .data;

// ---- Customer credits ----
export const listCustomerCredits = async (
  params?: ListCustomerCreditsParams,
): Promise<CustomerCreditsListResponse> =>
  (await api.get("companies/customer-credits/", { params })).data;

export const cancelCustomerCredit = async (
  id: number | string,
): Promise<ApiEnvelope<null>> =>
  (await api.post(`companies/customer-credits/${id}/cancel/`)).data;

// ---- Payments ledger ----
export const listPayments = async (
  params?: ListPaymentsParams,
): Promise<PaymentsListResponse> =>
  (await api.get("companies/payment-collections/", { params })).data;

// ---- Reports ----
export const getOverdueReport = async (
  params?: OverdueReportParams,
): Promise<OverdueReportResponse> =>
  (await api.get("companies/reports/overdue-debts/", { params })).data;

// ---- Warehouses ----
export const listWarehouses = async (
  params?: ListWarehousesParams,
): Promise<WarehousesListResponse> =>
  (await api.get("companies/warehouses/", { params })).data;

export const createWarehouse = async (
  payload: CreateWarehousePayload,
): Promise<WarehouseResponse> =>
  (await api.post("companies/warehouses/", payload)).data;

// ---- Settings ----
export const getInvoiceSettings = async (): Promise<InvoiceSettingsResponse> =>
  (await api.get("companies/invoice-settings/")).data;

export const updateInvoiceSettings = async (
  payload: UpdateInvoiceSettingsPayload,
): Promise<InvoiceSettingsResponse> =>
  (await api.patch("companies/invoice-settings/", payload)).data;
