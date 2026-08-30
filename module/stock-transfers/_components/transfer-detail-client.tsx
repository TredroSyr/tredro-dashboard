"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { useStockTransferQuery } from "../hooks";
import { useApproveStockTransferMutation, useCancelStockTransferMutation } from "../hooks";
import { formatDateTime, formatQuantity } from "../lib/format";
import { StockTransferStatusBadge } from "./status-badge";
import { ModifyTransferDialog } from "./modify-transfer-dialog";
import { TransferHistoryTimeline } from "./transfer-history-timeline";

const CANCELLABLE_STATUSES = new Set([
  "pending",
  "modified_by_admin",
  "pending_rep_confirmation",
  "confirmed",
]);

export function TransferDetailClient({ transferId }: { transferId: string }) {
  const { data, isLoading, isError, refetch } = useStockTransferQuery(transferId);
  const transfer = data?.data?.transfer;

  const [modifyOpen, setModifyOpen] = React.useState(false);
  const { mutate: approveTransfer, isPending: isApproving } =
    useApproveStockTransferMutation();
  const { mutate: cancelTransfer, isPending: isCancelling } =
    useCancelStockTransferMutation();

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل طلب البضاعة"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!isLoading && !transfer) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="الطلب غير موجود"
          message="طلب البضاعة الذي تحاول الوصول إليه غير موجود أو تم حذفه"
        />
      </div>
    );
  }

  const canAct = transfer && CANCELLABLE_STATUSES.has(transfer.status);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">الرئيسية</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/stock-transfers">تسليم بضاعة للمندوب</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <BreadcrumbPage>{transfer?.number}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {isLoading || !transfer ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <>
                  <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {transfer.number}
                  </h1>
                  <StockTransferStatusBadge status={transfer.status} />
                </>
              )}
            </div>
            {isLoading || !transfer ? (
              <Skeleton className="h-4 w-56" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {transfer.rep_name} · {transfer.source_warehouse_name} ←{" "}
                {transfer.destination_warehouse_name} ·{" "}
                {formatDateTime(transfer.requested_at)}
              </p>
            )}
          </div>

          <PermissionGate module="invoices" requireAction fallback={null}>
            {!isLoading && transfer && canAct && (
              <div className="flex shrink-0 gap-2">
                {transfer.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setModifyOpen(true)}
                    >
                      <IconRenderer name="edit_outlined" className="size-4" />
                      تعديل الكميات
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={isApproving}
                      onClick={() =>
                        approveTransfer(transfer.id, {
                          onError: (error) => toast.error(getApiErrorMessage(error)),
                        })
                      }
                    >
                      <IconRenderer name="tick_outlined" className="size-4" />
                      موافقة على الكميات المطلوبة
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isCancelling}
                  onClick={() =>
                    cancelTransfer(transfer.id, {
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    })
                  }
                >
                  إلغاء الطلب
                </Button>
              </div>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-5 sm:px-6">
        {isLoading || !transfer ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                الأصناف
              </h2>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">الصنف</th>
                      <th className="px-4 py-2.5 font-medium">المطلوبة</th>
                      <th className="px-4 py-2.5 font-medium">المعتمدة</th>
                      <th className="px-4 py-2.5 font-medium">ستتحرّك فعلياً</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.lines?.map((line) => {
                      const differs =
                        line.approved_qty !== null &&
                        line.approved_qty !== line.requested_qty;
                      return (
                        <tr key={line.id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3 text-foreground">
                            {line.product_name}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {formatQuantity(line.requested_qty)} {line.unit_name}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {line.approved_qty !== null
                              ? formatQuantity(line.approved_qty)
                              : "—"}
                          </td>
                          <td
                            className={
                              differs
                                ? "px-4 py-3 tabular-nums font-medium text-warning"
                                : "px-4 py-3 tabular-nums font-medium text-foreground"
                            }
                          >
                            {formatQuantity(line.effective_qty)} {line.unit_name}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {transfer.notes && (
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                  {transfer.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                السجل
              </h2>
              <TransferHistoryTimeline transferId={transfer.id} />
            </div>
          </>
        )}
      </div>

      {transfer && (
        <ModifyTransferDialog
          transfer={transfer}
          open={modifyOpen}
          onOpenChange={setModifyOpen}
        />
      )}
    </div>
  );
}
