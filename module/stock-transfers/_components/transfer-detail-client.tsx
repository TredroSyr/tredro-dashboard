"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Check, Clock, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PreparationBanner } from "./preparation-banner";
import { usePreparationStore } from "../store/preparation-store";
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

  const {
    startPreparation,
    getPreparation,
    toggleLine,
    completePreparation,
    removePreparation,
    isExpired: checkIsExpired,
  } = usePreparationStore();

  const transferIdNum = parseInt(transferId, 10);
  const preparation = React.useMemo(
    () => getPreparation(transferIdNum),
    [transferIdNum, getPreparation],
  );

  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCompletePreparation = () => {
    if (transfer) {
      completePreparation(transfer.id);
      toast.success("تم إكمال تحضير الطلب");
    }
  };

  const handleCancelPreparation = () => {
    if (transfer) {
      removePreparation(transfer.id);
    }
  };

  const handleApproveAndStartPreparation = () => {
    if (transfer) {
      approveTransfer(transfer.id, {
        onSuccess: () => {
          if (transfer.lines) {
            startPreparation(transfer.id, transfer.number, transfer.lines);
            toast.success("تم الموافقة على الطلب وبدء التحضير");
          }
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      });
    }
  };

  const isPreparing = !!preparation && !checkIsExpired(preparation);
  const preparationExpired = !!preparation && checkIsExpired(preparation);

  const checkedCount = preparation?.lines.filter((l) => l.checked).length ?? 0;
  const totalLines = preparation?.lines.length ?? transfer?.lines?.length ?? 0;
  const allChecked = checkedCount > 0 && checkedCount === totalLines;

  const handleProductClick = (productId: number) => {
    router.push(`/products/detail?id=${productId}`);
  };

  const renderLineCard = (line: StockTransfer["lines"][0], index: number) => {
    const differs =
      line.approved_qty !== null && line.approved_qty !== line.requested_qty;

    const prepLine = preparation?.lines.find((l) => l.lineId === line.id);
    const isChecked = prepLine?.checked ?? false;

    return (
      <Card
        key={line.id}
        className={`relative overflow-hidden transition-all ${
          isChecked ? "ring-2 ring-green-500 dark:ring-green-400" : ""
        }`}
      >
        {isChecked && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700 gap-1"
            >
              <Check className="h-3 w-3" />
              تم التأكيد
            </Badge>
          </div>
        )}

        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {isPreparing && (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleLine(transferIdNum, line.id)}
                    className="mt-1"
                  />
                )}
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
              <Badge
                variant={isChecked ? "default" : "secondary"}
                className={
                  isChecked
                    ? "bg-green-600 hover:bg-green-700"
                    : undefined
                }
              >
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
          <div className="flex flex-col gap-1">
            {isLoading || !transfer ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  className="text-lg font-semibold tracking-tight sm:text-xl tabular-nums"
                  dir="ltr"
                >
                  {transfer.number}
                </h1>
                <StockTransferStatusBadge status={transfer.status} />
              </div>
            )}
          </div>
        </div>

        {!isLoading && transfer && (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                {transfer.rep_name} · {transfer.source_warehouse_name} ←{" "}
                {transfer.destination_warehouse_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                          onClick={handleApproveAndStartPreparation}
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

              {isPreparing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleCancelPreparation}
                  >
                    إلغاء التحضير
                  </Button>
                  {allChecked && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700"
                      onClick={handleCompletePreparation}
                    >
                      <Check className="size-4" />
                      تم التحضير كاملاً
                    </Button>
                  )}
                </>
              )}
              {preparationExpired && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  onClick={() => removePreparation(transferIdNum)}
                >
                  <AlertTriangle className="size-4" />
                  انتهت صلاحية التحضير - ابدأ من جديد
                </Button>
              )}
            </div>

            {isPreparing && (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-2 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    وضع التحضير مفعّل
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    <span className="tabular-nums" dir="ltr">
                      {checkedCount}/{totalLines}
                    </span>{" "}
                    تم التحقق
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Clock className="h-4 w-4" />
                  <span>
                    الوقت المتبقي: {preparation ? calculateRemainingTime(new Date(preparation.expiresAt).toISOString()) : ""}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {activeTab === "items" && (
        <PreparationBanner currentTransferId={transferIdNum} />
      )}

      <TransferDetailTabs
        value={activeTab}
        onValueChange={setActiveTab}
        counts={transfer ? { lines: transfer.line_count } : undefined}
        isLoading={isLoading}
      />

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
