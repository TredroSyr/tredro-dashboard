"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  listSalesInvoices,
  getSalesInvoice,
  getSalesInvoiceHistory,
  createSalesInvoice,
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
} from "../api";
import {
  ListSalesInvoicesParams,
  CreateSalesInvoicePayload,
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
  LastPurchasePricesByCurrency,
} from "../types";

const onErrorToast = (fallback: string) => (error: AxiosError<ApiErrorResponse>) => {
  toast.error(error.response?.data?.message || fallback);
};

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
    queryKey: ["invoices", "sales", "detail", id !== undefined ? String(id) : id],
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
    queryKey: ["invoices", "sales", "history", id !== undefined ? String(id) : id],
    queryFn: () => getSalesInvoiceHistory(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateSalesInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalesInvoicePayload) =>
      createSalesInvoice(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "sales", "list"] });
      if (variables.credit_ids?.length) {
        queryClient.invalidateQueries({ queryKey: ["invoices", "credits"] });
      }
      toast.success(data.message || "تم إنشاء الفاتورة بنجاح");
    },
    onError: onErrorToast("تعذّر إنشاء الفاتورة"),
  });
};

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "sales", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "sales", "detail", String(variables.invoiceId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "sales", "history", String(variables.invoiceId)],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices", "payments"] });
      toast.success(data.message || "تم تسجيل الدفعة بنجاح");
    },
    onError: onErrorToast("تعذّر تسجيل الدفعة"),
  });
};

// ---- Incoming invoices ----
export const useIncomingInvoicesQuery = (
  params?: ListIncomingInvoicesParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "list", params],
    queryFn: () => listIncomingInvoices(params),
    enabled: options?.enabled ?? true,
  });

export const useIncomingInvoiceQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "detail", id !== undefined ? String(id) : id],
    queryFn: () => getIncomingInvoice(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useIncomingInvoiceHistoryQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "incoming", "history", id !== undefined ? String(id) : id],
    queryFn: () => getIncomingInvoiceHistory(id as string | number),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

export const useCreateIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncomingInvoicePayload) =>
      createIncomingInvoice(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
      toast.success(data.message || "تم إنشاء فاتورة الوارد بنجاح");
    },
    onError: onErrorToast("تعذّر إنشاء فاتورة الوارد"),
  });
};

export const useIssueIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => issueIncomingInvoice(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "detail", String(id)],
      });
      toast.success(data.message || "تم ترحيل الفاتورة بنجاح");
    },
    onError: onErrorToast("تعذّر ترحيل الفاتورة"),
  });
};

/**
 * How many of the product's most recent incoming invoices to open (in parallel) looking
 * for a line on it. There's no backend endpoint or filter for "last purchase price of a
 * product" yet (the list endpoint returns no lines, only invoice detail does), so this
 * scans recent invoice details client-side — a bounded, best-effort substitute.
 */
const LAST_PURCHASE_SCAN_LIMIT = 20;

/** Per currency, the most recent price paid for this product across recent incoming invoices. */
export const useLastPurchasePricesQuery = (
  productId?: number | string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [
      "invoices",
      "incoming",
      "last-purchase-prices",
      productId !== undefined ? String(productId) : productId,
    ],
    queryFn: async (): Promise<LastPurchasePricesByCurrency> => {
      const listRes = await listIncomingInvoices({ page_size: 100 });
      const recentInvoices = (listRes.data?.invoices ?? [])
        .filter((invoice) => invoice.status !== "cancelled")
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, LAST_PURCHASE_SCAN_LIMIT);

      const details = await Promise.all(
        recentInvoices.map((invoice) => getIncomingInvoice(invoice.id)),
      );

      const byCurrency: LastPurchasePricesByCurrency = {};
      for (const res of details) {
        const invoice = res.data?.invoice;
        const line = invoice?.lines?.find(
          (l) => l.product === Number(productId),
        );
        if (!invoice || !line || byCurrency[invoice.currency]) continue;
        byCurrency[invoice.currency] = {
          price: line.unit_price,
          currency: invoice.currency,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          date: invoice.date,
        };
      }
      return byCurrency;
    },
    enabled: (options?.enabled ?? true) && Boolean(productId),
    staleTime: 5 * 60 * 1000,
  });

export const useCancelIncomingInvoiceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => cancelIncomingInvoice(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoices", "incoming", "detail", String(id)],
      });
      toast.success(data.message || "تم إلغاء الفاتورة بنجاح");
    },
    onError: onErrorToast("تعذّر إلغاء الفاتورة"),
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
    queryKey: ["invoices", "returns", "detail", id !== undefined ? String(id) : id],
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
          queryKey: ["invoices", "sales", "detail", String(salesInvoiceId)],
        });
      }
      toast.success(data.message || "تم إنشاء فاتورة المرتجع بنجاح");
    },
    onError: onErrorToast("تعذّر إنشاء فاتورة المرتجع"),
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
        queryKey: ["invoices", "returns", "detail", String(variables.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices", "sales", "list"] });
      const salesInvoiceId = data?.data?.invoice?.id;
      if (salesInvoiceId) {
        queryClient.invalidateQueries({
          queryKey: ["invoices", "sales", "detail", String(salesInvoiceId)],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["invoices", "credits"] });
      toast.success(data.message || "تم ترحيل فاتورة المرتجع بنجاح");
    },
    onError: onErrorToast("تعذّر ترحيل فاتورة المرتجع"),
  });
};

// ---- Customer credits ----
export const useCustomerCreditsQuery = (
  params?: ListCustomerCreditsParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["invoices", "credits", "list", params],
    queryFn: () => listCustomerCredits(params),
    enabled: options?.enabled ?? true,
  });

export const useCancelCustomerCreditMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => cancelCustomerCredit(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "credits"] });
      toast.success(data.message || "تم إلغاء رصيد العميل بنجاح");
    },
    onError: onErrorToast("تعذّر إلغاء رصيد العميل"),
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", "settings"] });
      toast.success(data.message || "تم تحديث إعدادات الفواتير بنجاح");
    },
    onError: onErrorToast("تعذّر تحديث إعدادات الفواتير"),
  });
};
