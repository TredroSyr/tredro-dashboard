"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useRepsQuery } from "@/module/reps/hooks";
import { DataTable } from "@/module/reps/_components/data-table";
import { createTransferColumns } from "./transfer-columns";
import { ModifyTransferDialog } from "./modify-transfer-dialog";
import { CreateDispatchDrawer } from "./create-dispatch-drawer";
import { StockTransferStatusBadge } from "./status-badge";
import {
  useApproveStockTransferMutation,
  useCancelStockTransferMutation,
  useStockTransfersQuery,
} from "../hooks";
import type { StockTransfer, StockTransferStatus } from "../types";
import { formatDateTime, calculateRemainingTime, formatDateNumeric } from "../lib/format";

const PAGE_SIZE = 8;

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
  const [dispatchOpen, setDispatchOpen] = React.useState(false);

  // Fetch all transfers without page param for frontend pagination
  const params = React.useMemo(
    () => ({
      // Don't pass page for frontend pagination - fetch all
      search: undefined,
      status: undefined,
      rep: undefined,
    }),
    [],
  );

  // Poll every 30 seconds
  const { data, isLoading, isError, error, refetch } = useStockTransfersQuery(params, 30000);
  const transfers = data?.data?.transfers ?? [];
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

  // Force re-render every 30 seconds for countdown updates
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 30000);
    return () => clearInterval(interval);
  }, []);

  // Frontend filtering like RepsView
  const filteredTransfers = React.useMemo(() => {
    let result = [...transfers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.number.toLowerCase().includes(q) ||
          t.rep_name.toLowerCase().includes(q),
      );
    }

    if (status !== "all") {
      result = result.filter((t) => t.status === status);
    }

    if (rep) {
      result = result.filter((t) => String(t.rep) === rep);
    }

    return result;
  }, [transfers, search, status, rep]);

  // Frontend pagination like RepsView
  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / PAGE_SIZE));

  const paginatedTransfers = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransfers.slice(start, start + PAGE_SIZE);
  }, [filteredTransfers, page]);

  const { mutate: approveTransfer, isPending: isApproving } =
    useApproveStockTransferMutation();
  const { mutate: cancelTransfer, isPending: isCancelling } =
    useCancelStockTransferMutation();

  const goToDetail = (transfer: StockTransfer) =>
    router.push(`/stock-transfers/detail?id=${transfer.id}`);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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

  function renderPickupBadge(transfer: StockTransfer) {
    const remainingTime = calculateRemainingTime(transfer.pickup_deadline);
    const isExpired = remainingTime === "انتهى الوقت";

    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          {remainingTime}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" />
        {remainingTime}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              طلبات المندوب
            </h1>
            <p className="text-sm text-muted-foreground">
              طلبات المناديب لتحميل الفان، من الموافقة حتى الاستلام
            </p>
          </div>
          <PermissionGate module="invoices" requireAction fallback={null}>
            <Button size="sm" className="gap-1.5" onClick={() => setDispatchOpen(true)}>
              <IconRenderer name="plus_outlined" className="size-3.5" />
              إرسال بضاعة لمندوب
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters section */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-4 sm:px-6 border-b border-border">
        <div className="relative w-full xs:w-[220px] sm:w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث برقم الطلب أو اسم المندوب..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
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

        <Badge className="font-normal">{filteredTransfers.length} طلب</Badge>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <DataTable
          columns={columns}
          data={paginatedTransfers}
          total={filteredTransfers.length}
          search={search}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الطلبات"
          }
          onRetry={() => refetch()}
          pagination={{ page, totalPages }}
          onPageChange={setPage}
          showToolbar={false}
          renderCard={(t: StockTransfer) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground tabular-nums" dir="ltr">
                    {t.number}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                    {t.rep_name} · {formatDateNumeric(t.requested_at)}
                  </p>
                </div>
                <StockTransferStatusBadge status={t.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t.source_warehouse_name} ← {t.destination_warehouse_name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  عدد الأصناف: <span className="tabular-nums" dir="ltr">{t.line_count ?? 0}</span>
                </p>
                {t.pickup_deadline && renderPickupBadge(t)}
              </div>
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
        />
      </div>

      <ModifyTransferDialog
        transfer={modifyTarget}
        open={Boolean(modifyTarget)}
        onOpenChange={(open) => !open && setModifyTarget(null)}
      />

      <CreateDispatchDrawer open={dispatchOpen} onOpenChange={setDispatchOpen} />
    </div>
  );
}
