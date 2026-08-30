"use client";

import * as React from "react";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { EmptyState } from "@/components/tredro/empty-state";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { InvoicesDataTable } from "./data-table";
import { createIncomingInvoiceColumns } from "./incoming-invoices-columns";
import { IncomingInvoiceDrawer } from "./incoming-invoice-drawer";
import { IncomingInvoiceDetailSheet } from "./incoming-invoice-detail-drawer";
import { DocumentStatusBadge } from "./status-badge";
import {
  useCancelIncomingInvoiceMutation,
  useIncomingInvoicesQuery,
  useIssueIncomingInvoiceMutation,
} from "../hooks";
import type { IncomingInvoice, IncomingInvoiceStatus } from "../types";
import { formatDate, formatMoney } from "../lib/format";

const STATUS_OPTIONS: { value: IncomingInvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "issued", label: "مرحّلة" },
  { value: "cancelled", label: "ملغاة" },
];

export function IncomingInvoicesView() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<IncomingInvoiceStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<number | null>(null);

  const params = React.useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
      page,
    }),
    [search, status, page],
  );

  const { data, isLoading, isError, error, refetch } = useIncomingInvoicesQuery(
    params,
  );
  const invoices = data?.data?.invoices ?? [];
  const pagination = data?.data?.pagination;
  const hasActiveFilters = Boolean(search.trim()) || status !== "all";

  const { mutate: issueInvoice, isPending: isIssuing } =
    useIssueIncomingInvoiceMutation();
  const { mutate: cancelInvoice, isPending: isCancelling } =
    useCancelIncomingInvoiceMutation();

  const handleIssue = (
    id: number,
    options?: { onSuccess?: () => void; onError?: (message: string) => void },
  ) =>
    issueInvoice(id, {
      onSuccess: options?.onSuccess,
      onError: (error) => {
        const message = getApiErrorMessage(error);
        options?.onError?.(message);
        toast.error(message);
      },
    });

  const handleCancel = (
    id: number,
    options?: { onSuccess?: () => void; onError?: (message: string) => void },
  ) =>
    cancelInvoice(id, {
      onSuccess: options?.onSuccess,
      onError: (error) => {
        const message = getApiErrorMessage(error);
        options?.onError?.(message);
        toast.error(message);
      },
    });

  const columns = React.useMemo(
    () =>
      createIncomingInvoiceColumns({
        onIssue: (invoice) => handleIssue(invoice.id),
        onCancel: (invoice) => handleCancel(invoice.id),
        onView: (invoice) => setDetailId(invoice.id),
        isIssuing,
        isCancelling,
      }),
    [issueInvoice, cancelInvoice, isIssuing, isCancelling],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          فواتير الإدخال
          {pagination && <Badge className="font-normal">{pagination.count}</Badge>}
        </h2>
        <PermissionGate module="invoices" requireAction fallback={null}>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            فاتورة إدخال جديدة
          </Button>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full xs:w-[220px] sm:w-[260px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث برقم الفاتورة..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>

        <SearchableSelect
          hideSearch
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v as IncomingInvoiceStatus | "all");
            setPage(1);
          }}
          placeholder="كل الحالات"
          className="h-8 w-[150px] rounded-lg"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPage(1);
            }}
            className="gap-1 text-muted-foreground"
          >
            <X className="size-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <InvoicesDataTable
        columns={columns}
        data={invoices}
        pagination={
          pagination
            ? { page: pagination.page, totalPages: pagination.total_pages }
            : undefined
        }
        onPageChange={setPage}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "حدث خطأ أثناء تحميل فواتير الإدخال"
        }
        onRetry={() => refetch()}
        onRowClick={(invoice) => setDetailId(invoice.id)}
        renderMobileCard={(invoice: IncomingInvoice) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{invoice.number}</p>
                <p className="text-xs text-muted-foreground">
                  {invoice.warehouse_name} · {formatDate(invoice.date)}
                </p>
              </div>
              <DocumentStatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {invoice.supplier_ref || "—"}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatMoney(invoice.total_amount, invoice.currency)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              {invoice.status === "draft" && (
                <PermissionGate module="invoices" requireAction fallback={null}>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconRenderer name="more_outlined" className="size-3.5" />
                        إجراءات
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuItem
                        disabled={isIssuing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIssue(invoice.id);
                        }}
                      >
                        <IconRenderer name="tick_outlined" className="size-4" />
                        ترحيل الفاتورة — اضافة الكمية لمستودع الشركة
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isCancelling}
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(invoice.id);
                        }}
                      >
                        <IconRenderer name="close_outlined" className="size-4" />
                        إلغاء الفاتورة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGate>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailId(invoice.id);
                }}
              >
                <IconRenderer name="eye_visible_outlined" className="size-3.5" />
                عرض
              </Button>
            </div>
          </div>
        )}
        emptyState={
          hasActiveFilters ? (
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                لا توجد فواتير مطابقة
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("all");
                }}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <EmptyState
              variant="invoices"
              size="sm"
              title="لا توجد فواتير إدخال بعد"
              description="سجّل استلام بضاعة من المورّد أو الشركة الأم لإضافتها لمستودع الشركة."
            />
          )
        }
      />

      <IncomingInvoiceDrawer open={createOpen} onOpenChange={setCreateOpen} />

      <IncomingInvoiceDetailSheet
        invoiceId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        onIssue={handleIssue}
        onCancel={(id, options) =>
          handleCancel(id, {
            onSuccess: () => setDetailId(null),
            onError: options?.onError,
          })
        }
        isIssuing={isIssuing}
        isCancelling={isCancelling}
      />
    </div>
  );
}
