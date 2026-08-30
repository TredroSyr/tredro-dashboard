"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { StockTransfersDataTable } from "./data-table";
import { createTransferColumns } from "./transfer-columns";
import { ModifyTransferDialog } from "./modify-transfer-dialog";
import { StockTransferStatusBadge } from "./status-badge";
import {
  useApproveStockTransferMutation,
  useCancelStockTransferMutation,
  useStockTransfersQuery,
} from "../hooks";
import type { StockTransfer, StockTransferStatus } from "../types";
import { formatDateTime } from "../lib/format";

const STATUS_OPTIONS: { value: StockTransferStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "بانتظار الموافقة" },
  { value: "modified_by_admin", label: "تم تعديل الكميات" },
  { value: "pending_rep_confirmation", label: "بانتظار موافقة المندوب" },
  { value: "confirmed", label: "موافَق عليه" },
  { value: "received", label: "تم الاستلام" },
  { value: "cancelled", label: "ملغى" },
];

export default function StockTransfersView() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StockTransferStatus | "all">("all");
  const [rep, setRep] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [modifyTarget, setModifyTarget] = React.useState<StockTransfer | null>(null);

  const params = React.useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
      rep: rep || undefined,
      page,
    }),
    [search, status, rep, page],
  );

  const { data, isLoading, isError, error, refetch } = useStockTransfersQuery(params);
  const transfers = data?.data?.transfers ?? [];
  const pagination = data?.data?.pagination;
  const hasActiveFilters = Boolean(search.trim()) || status !== "all" || Boolean(rep);

  const { data: repsRes } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const { mutate: approveTransfer, isPending: isApproving } =
    useApproveStockTransferMutation();
  const { mutate: cancelTransfer, isPending: isCancelling } =
    useCancelStockTransferMutation();

  const goToDetail = (transfer: StockTransfer) =>
    router.push(`/stock-transfers/detail?id=${transfer.id}`);

  const columns = React.useMemo(
    () =>
      createTransferColumns({
        onApprove: (t) =>
          approveTransfer(t.id, {
            onError: (error) => toast.error(getApiErrorMessage(error)),
          }),
        onModify: setModifyTarget,
        onCancel: (t) =>
          cancelTransfer(t.id, {
            onError: (error) => toast.error(getApiErrorMessage(error)),
          }),
        onView: goToDetail,
        isApproving,
        isCancelling,
      }),
    [approveTransfer, cancelTransfer, isApproving, isCancelling],
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            تسليم بضاعة للمندوب
          </h1>
          <p className="text-sm text-muted-foreground">
            طلبات المناديب لتحميل الفان، من الموافقة حتى الاستلام
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full xs:w-[220px] sm:w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث برقم الطلب..."
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
              setStatus(v as StockTransferStatus | "all");
              setPage(1);
            }}
            placeholder="كل الحالات"
            className="h-8 w-[170px] rounded-lg"
          />

          <SearchableSelect
            options={repOptions}
            value={rep}
            onChange={(v) => {
              setRep(v);
              setPage(1);
            }}
            placeholder="كل المناديب"
            searchPlaceholder="ابحث عن مندوب..."
            className="h-8 w-[160px] rounded-lg"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setRep("");
                setPage(1);
              }}
              className="gap-1 text-muted-foreground"
            >
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}

          {pagination && <Badge className="font-normal">{pagination.count} طلب</Badge>}
        </div>

        <StockTransfersDataTable
          columns={columns}
          data={transfers}
          pagination={
            pagination
              ? { page: pagination.page, totalPages: pagination.total_pages }
              : undefined
          }
          onPageChange={setPage}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الطلبات"
          }
          onRetry={() => refetch()}
          onRowClick={goToDetail}
          renderMobileCard={(t: StockTransfer) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{t.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.rep_name} · {formatDateTime(t.requested_at)}
                  </p>
                </div>
                <StockTransferStatusBadge status={t.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t.source_warehouse_name} ← {t.destination_warehouse_name}
              </p>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDetail(t);
                  }}
                >
                  عرض التفاصيل
                </Button>
              </div>
            </div>
          )}
          emptyState={
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              {hasActiveFilters ? "لا توجد طلبات مطابقة" : "لا توجد طلبات بضاعة بعد"}
            </div>
          }
        />
      </div>

      <ModifyTransferDialog
        transfer={modifyTarget}
        open={Boolean(modifyTarget)}
        onOpenChange={(open) => !open && setModifyTarget(null)}
      />
    </div>
  );
}
