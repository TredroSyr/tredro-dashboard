"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSalesInvoices,
  getSalesInvoice,
  getSalesInvoiceHistory,
  recordPayment,
  listIncomingInvoices,
  getIncomingInvoice,
  createIncomingInvoice,
  issueIncomingInvoice,
  cancelIncomingInvoice,
  getIncomingInvoiceHistory,
  listReturnInvoices,
  getReturnInvoice,
  createReturnInvoice,
  issueReturnInvoice,
  listCustomerCredits,
  cancelCustomerCredit,
  listPayments,
  getOverdueReport,
  getInvoiceSettings,
  updateInvoiceSettings,
  listWarehouses,
  createWarehouse,
} from "../api";
import {
  ListSalesInvoicesParams,
  RecordPaymentPayload,
  ListIncomingInvoicesParams,
  CreateIncomingInvoicePayload,
  ListReturnInvoicesParams,
  CreateReturnInvoicePayload,
  IssueReturnInvoicePayload,
  ListCustomerCreditsParams,
  ListPaymentsParams,
  OverdueReportParams,
  UpdateInvoiceSettingsPayload,
  ListWarehousesParams,
  CreateWarehousePayload,
} from "../types";

// ---- Sales invoices ----
export const useSalesInvoicesQuery = (params?: ListSalesInvoicesParams) =>
  useQuery({
    queryKey: ["invoices", "sales", "list", params],
    queryFn: () => listSalesInvoices(params),
  });

export const useSalesInvoiceQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "sales", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("getSalesInvoice called without id");
      return getSalesInvoice(id);
    },
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useSalesInvoiceHistoryQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "sales", "history", id],
    queryFn: () => getSalesInvoiceHistory(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useRecordPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: number | string;
      payload: RecordPaymentPayload;
    }) => recordPayment(invoiceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "sales", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "sales", "detail", variables.invoiceId],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices", "payments"] });
    },
  });
};

// ---- Incoming invoices ----
export const useIncomingInvoicesQuery = (
  params?: ListIncomingInvoicesParams,
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "list", params],
    queryFn: () => listIncomingInvoices(params),
  });

export const useIncomingInvoiceQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "detail", id],
    queryFn: () => getIncomingInvoice(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useIncomingInvoiceHistoryQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "history", id],
    queryFn: () => getIncomingInvoiceHistory(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncomingInvoicePayload) =>
      createIncomingInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
    },
  });
};

export const useIssueIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => issueIncomingInvoice(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "detail", id],
      });
    },
  });
};

export const useCancelIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => cancelIncomingInvoice(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "detail", id],
      });
    },
  });
};

// ---- Return invoices ----
export const useReturnInvoicesQuery = (params?: ListReturnInvoicesParams) =>
  useQuery({
    queryKey: ["invoices", "returns", "list", params],
    queryFn: () => listReturnInvoices(params),
  });

export const useReturnInvoiceQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "returns", "detail", id],
    queryFn: () => getReturnInvoice(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateReturnInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnInvoicePayload) =>
      createReturnInvoice(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "returns", "list"],
      });
      const salesInvoiceId = data?.data?.return_invoice?.sales_invoice;
      if (salesInvoiceId) {
        queryClient.invalidateQueries({
          queryKey: ["invoices", "sales", "detail", salesInvoiceId],
        });
      }
    },
  });
};

export const useIssueReturnInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload?: IssueReturnInvoicePayload;
    }) => issueReturnInvoice(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "returns", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "returns", "detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices", "sales", "list"] });
      const salesInvoiceId = data?.data?.invoice?.id;
      if (salesInvoiceId) {
        queryClient.invalidateQueries({
          queryKey: ["invoices", "sales", "detail", salesInvoiceId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["invoices", "credits"] });
    },
  });
};

// ---- Customer credits ----
export const useCustomerCreditsQuery = (params?: ListCustomerCreditsParams) =>
  useQuery({
    queryKey: ["invoices", "credits", "list", params],
    queryFn: () => listCustomerCredits(params),
  });

export const useCancelCustomerCreditMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => cancelCustomerCredit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "credits"] });
    },
  });
};

// ---- Payments ledger ----
export const usePaymentsQuery = (params?: ListPaymentsParams) =>
  useQuery({
    queryKey: ["invoices", "payments", "list", params],
    queryFn: () => listPayments(params),
  });

// ---- Reports ----
export const useOverdueReportQuery = (params?: OverdueReportParams) =>
  useQuery({
    queryKey: ["invoices", "reports", "overdue", params],
    queryFn: () => getOverdueReport(params),
  });

// ---- Warehouses ----
export const useWarehousesQuery = (params?: ListWarehousesParams) =>
  useQuery({
    queryKey: ["invoices", "warehouses", "list", params],
    queryFn: () => listWarehouses(params),
  });

export const useCreateWarehouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "warehouses", "list"],
      });
    },
  });
};

// ---- Settings ----
export const useInvoiceSettingsQuery = () =>
  useQuery({
    queryKey: ["invoices", "settings"],
    queryFn: getInvoiceSettings,
  });

export const useUpdateInvoiceSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInvoiceSettingsPayload) =>
      updateInvoiceSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "settings"] });
    },
  });
};
