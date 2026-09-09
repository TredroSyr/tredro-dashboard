"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TransferDetailTabs } from "./transfer-detail-tabs";
import {
  useStockTransferQuery,
  useApproveStockTransferMutation,
  useCancelStockTransferMutation,
} from "../hooks";
import { formatDateTime, formatQuantity, calculateRemainingTime } from "../lib/format";
import { translateUnit } from "../lib/units";
import { StockTransferStatusBadge } from "./status-badge";
import { ModifyTransferDialog } from "./modify-transfer-dialog";
import { TransferHistoryTimeline } from "./transfer-history-timeline";
import type { StockTransfer } from "../types";

const CANCELLABLE_STATUSES = new Set([
  "pending",
  "modified_by_admin",
  "pending_rep_confirmation",
  "confirmed",
]);

export function TransferDetailClient({ transferId }: { transferId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useStockTransferQuery(transferId, 30000);
  const transfer = data?.data?.transfer;

  const [modifyOpen, setModifyOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("items");
  const { mutate: approveTransfer, isPending: isApproving } =
    useApproveStockTransferMutation();
  const { mutate: cancelTransfer, isPending: isCancelling } =
    useCancelStockTransferMutation();

  const handleApprove = () => {
    if (transfer) {
      approveTransfer(transfer.id, {
        onError: (error) => toast.error(getApiErrorMessage(error)),
      });
    }
  };

  const handleProductClick = (productId: number) => {
    router.push(`/products/detail?id=${productId}`);
  };

  const renderLineCard = (line: StockTransfer["lines"][0], index: number) => {
    const differs =
      line.approved_qty !== null && line.approved_qty !== line.requested_qty;

    return (
      <Card key={line.id} className="relative overflow-hidden">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(line.product);
                    }}
                    className="text-right hover:underline"
                  >
                    <p className="font-semibold text-foreground">
                      {line.product_name}
                    </p>
                    {line.product_sku && (
                      <p
                        className="text-xs text-muted-foreground tabular-nums"
                        dir="ltr"
                      >
                        SKU: {line.product_sku}
                      </p>
                    )}
                  </button>
                </div>
              </div>
              <Badge variant="secondary">
                <span className="tabular-nums" dir="ltr">
                  {index + 1}
                </span>
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">المطلوبة</p>
                <p className="font-medium tabular-nums" dir="ltr">
                  {formatQuantity(line.requested_qty)} {translateUnit(line.unit_name)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">المعتمدة</p>
                <p className="font-medium tabular-nums" dir="ltr">
                  {line.approved_qty !== null
                    ? formatQuantity(line.approved_qty)
                    : "—"}
                </p>
              </div>
              <div
                className={`text-center ${
                  differs ? "bg-warning/10 rounded-lg py-1" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  ستتحرّك فعلياً
                </p>
                <p
                  className={`font-medium tabular-nums ${
                    differs ? "text-warning" : "text-foreground"
                  }`}
                  dir="ltr"
                >
                  {formatQuantity(line.effective_qty)} {translateUnit(line.unit_name)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
      <div className="sticky top-0 z-20 bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/stock-transfers")}
              className="shrink-0"
            >
              <IconRenderer name="arrow_right_outlined" className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              {isLoading || !transfer ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <h1
                  className="text-lg font-semibold tracking-tight sm:text-xl tabular-nums"
                  dir="ltr"
                >
                  {transfer.number}
                </h1>
              )}
              {isLoading || !transfer ? (
                <Skeleton className="h-6 w-16 rounded-full" />
              ) : (
                <StockTransferStatusBadge status={transfer.status} />
              )}
            </div>
          </div>

          {!isLoading && transfer && (
            <>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>
                  {transfer.rep_name} · {transfer.source_warehouse_name} ←{" "}
                  {transfer.destination_warehouse_name}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span>تاريخ الطلب: {formatDateTime(transfer.requested_at)}</span>
                  {transfer.pickup_deadline && (
                    <div className="flex items-center gap-1">
                      <span>وقت الاستلام:</span>
                      <Badge
                        variant={
                          calculateRemainingTime(transfer.pickup_deadline) ===
                          "انتهى الوقت"
                            ? "destructive"
                            : "secondary"
                        }
                        className="tabular-nums gap-1"
                      >
                        {calculateRemainingTime(transfer.pickup_deadline) ===
                        "انتهى الوقت" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {calculateRemainingTime(transfer.pickup_deadline)}
                      </Badge>
                      <span className="tabular-nums" dir="ltr">
                        ({formatDateTime(transfer.pickup_deadline)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <PermissionGate module="invoices" requireAction fallback={null}>
                  {canAct && (
                    <>
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
                            onClick={handleApprove}
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
                    </>
                  )}
                </PermissionGate>
              </div>
            </>
          )}
        </div>

        <TransferDetailTabs
          value={activeTab}
          onValueChange={setActiveTab}
          counts={transfer ? { lines: transfer.line_count } : undefined}
          isLoading={isLoading}
        />
      </div>

      <div className="px-4 sm:px-6 py-2">
        {activeTab === "items" && (
          <>
            {isLoading || !transfer ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                  {transfer.lines?.map((line, index) =>
                    renderLineCard(line, index)
                  )}
                </div>

                {transfer.notes && (
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                    {transfer.notes}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {!isLoading && transfer && (
              <div className="flex flex-col gap-2">
                <TransferHistoryTimeline transferId={transfer.id} />
              </div>
            )}
          </>
        )}
      </div>

      {transfer && (
        <ModifyTransferDialog
          transfer={transfer}
          open={modifyOpen}
          onOpenChange={(open) => !open && setModifyOpen(false)}
        />
      )}
    </div>
  );
}
