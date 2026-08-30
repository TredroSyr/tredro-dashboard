"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { EmptyState } from "@/components/tredro/empty-state";
import { InvoicesDataTable } from "./data-table";
import {
  createCustomerCreditColumns,
  createReturnInvoiceColumns,
} from "./returns-credits-columns";
import { IssueReturnDialog } from "./issue-return-dialog";
import { useCancelCustomerCreditMutation } from "../hooks";
import {
  useCustomerCreditsQuery,
  useReturnInvoicesQuery,
} from "../hooks";
import type { PendingCustomerCredit, ReturnInvoice } from "../types";
import { formatMoney } from "../lib/format";

export function ReturnsCreditsView() {
  const router = useRouter();
  const [returnsPage, setReturnsPage] = React.useState(1);
  const [creditsPage, setCreditsPage] = React.useState(1);
  const [issueTarget, setIssueTarget] = React.useState<ReturnInvoice | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = React.useState<PendingCustomerCredit | null>(
    null,
  );

  const {
    data: returnsData,
    isLoading: isReturnsLoading,
    isError: isReturnsError,
    refetch: refetchReturns,
  } = useReturnInvoicesQuery({ page: returnsPage });
  const returns = returnsData?.data?.return_invoices ?? [];
  const returnsPagination = returnsData?.data?.pagination;

  const {
    data: creditsData,
    isLoading: isCreditsLoading,
    isError: isCreditsError,
    refetch: refetchCredits,
  } = useCustomerCreditsQuery({ status: "pending", page: creditsPage });
  const credits = creditsData?.data?.credits ?? [];
  const creditsPagination = creditsData?.data?.pagination;

  const { mutate: cancelCredit, isPending: isCancellingCredit } =
    useCancelCustomerCreditMutation();

  const returnColumns = React.useMemo(
    () =>
      createReturnInvoiceColumns({
        onIssue: setIssueTarget,
        onView: (r) => router.push(`/invoices/detail?id=${r.sales_invoice}`),
      }),
    [router],
  );

  const creditColumns = React.useMemo(
    () => createCustomerCreditColumns({ onCancel: setCancelTarget }),
    [],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          المرتجعات
          {returnsPagination && (
            <Badge className="font-normal">{returnsPagination.count}</Badge>
          )}
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          يُنشأ المرتجع دائماً من داخل فاتورة البيع الأصلية — افتح الفاتورة من
          تبويب فواتير البيع لتسجيل إرجاع جديد.
        </p>

        <InvoicesDataTable
          columns={returnColumns}
          data={returns}
          pagination={
            returnsPagination
              ? {
                  page: returnsPagination.page,
                  totalPages: returnsPagination.total_pages,
                }
              : undefined
          }
          onPageChange={setReturnsPage}
          isLoading={isReturnsLoading}
          isError={isReturnsError}
          onRetry={() => refetchReturns()}
          onRowClick={(r) =>
            router.push(`/invoices/detail?id=${r.sales_invoice}`)
          }
          renderMobileCard={(r: ReturnInvoice) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{r.number}</span>
                <span className="tabular-nums text-foreground">
                  {formatMoney(r.amount)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                عن فاتورة {r.sales_invoice_number}
              </span>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-2 mt-1">
                {r.status === "draft" && (
                  <PermissionGate module="invoices" requireAction fallback={null}>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIssueTarget(r);
                      }}
                    >
                      <IconRenderer name="tick_outlined" className="size-3.5" />
                      ترحيل
                    </Button>
                  </PermissionGate>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/invoices/detail?id=${r.sales_invoice}`);
                  }}
                >
                  <IconRenderer name="eye_visible_outlined" className="size-3.5" />
                  عرض
                </Button>
              </div>
            </div>
          )}
          emptyState={
            <EmptyState
              variant="invoices"
              size="sm"
              title="لا توجد مرتجعات بعد"
              description="عندما يُرجع زبون بضاعة عبر مندوبه ستظهر فاتورة المرتجع هنا."
            />
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          الأرصدة الدائنة المتاحة للزبائن
          {creditsPagination && (
            <Badge className="font-normal">{creditsPagination.count}</Badge>
          )}
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          رصيد دائن ناتج عن مرتجع تجاوز قيمته المبلغ المتبقي على الفاتورة —
          يُطبَّق يدوياً على فاتورة بيع قادمة، ولا يُخصم تلقائياً.
        </p>

        <InvoicesDataTable
          columns={creditColumns}
          data={credits}
          pagination={
            creditsPagination
              ? {
                  page: creditsPagination.page,
                  totalPages: creditsPagination.total_pages,
                }
              : undefined
          }
          onPageChange={setCreditsPage}
          isLoading={isCreditsLoading}
          isError={isCreditsError}
          onRetry={() => refetchCredits()}
          renderMobileCard={(c: PendingCustomerCredit) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {c.customer_name}
                </span>
                <span className="tabular-nums text-foreground">
                  {formatMoney(c.amount)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                عن مرتجع {c.source_return_invoice_number}
              </span>
              {c.status === "pending" && (
                <div className="flex items-center justify-end border-t border-border pt-2 mt-1">
                  <PermissionGate module="invoices" requireAction fallback={null}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget(c);
                      }}
                    >
                      <IconRenderer name="close_outlined" className="size-3.5" />
                      إلغاء الرصيد
                    </Button>
                  </PermissionGate>
                </div>
              )}
            </div>
          )}
          emptyState={
            <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              لا توجد أرصدة دائنة متاحة حالياً
            </div>
          }
        />
      </div>

      <IssueReturnDialog
        returnInvoice={issueTarget}
        open={Boolean(issueTarget)}
        onOpenChange={(open) => !open && setIssueTarget(null)}
        onIssued={() => setIssueTarget(null)}
      />

      {cancelTarget && (
        <CancelCreditConfirm
          credit={cancelTarget}
          isPending={isCancellingCredit}
          onCancel={() =>
            cancelCredit(cancelTarget.id, {
              onSuccess: () => setCancelTarget(null),
              onError: (error) => toast.error(getApiErrorMessage(error)),
            })
          }
          onDismiss={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}

function CancelCreditConfirm({
  credit,
  isPending,
  onCancel,
  onDismiss,
}: {
  credit: PendingCustomerCredit;
  isPending: boolean;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open: boolean) => !open && onDismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>إلغاء الرصيد الدائن</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم شطب رصيد {formatMoney(credit.amount)} الخاص بـ{" "}
            {credit.customer_name} نهائياً ولن يعد بالإمكان استخدامه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>تراجع</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onCancel}>
            {isPending ? "جارٍ الإلغاء..." : "إلغاء الرصيد"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
