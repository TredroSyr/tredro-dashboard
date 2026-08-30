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
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useCustomersQuery } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";
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
import type {
  CustomerCreditStatus,
  PendingCustomerCredit,
  ReturnInvoice,
  ReturnInvoiceStatus,
} from "../types";
import { formatMoney } from "../lib/format";

const PAGE_SIZE = 10;

const RETURN_STATUS_OPTIONS: { value: ReturnInvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "issued", label: "مرحّلة" },
];

const CREDIT_STATUS_OPTIONS: { value: CustomerCreditStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "متاح" },
  { value: "applied", label: "مُستخدم" },
  { value: "cancelled", label: "مُلغى" },
];

interface ReturnsCreditsViewProps {
  customerId?: string | number;
  repId?: string | number;
}

export function ReturnsCreditsView({ customerId, repId }: ReturnsCreditsViewProps = {}) {
  const router = useRouter();

  // Scoped to a single customer/rep (e.g. opened from their detail page) -
  // the matching select is redundant and locked to that id instead.
  const hideCustomerFilter = Boolean(customerId);
  const hideRepFilter = Boolean(repId);

  const { data: customersRes } = useCustomersQuery();
  const customerOptions = React.useMemo(
    () =>
      (customersRes?.data?.customers ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [customersRes],
  );

  const { data: repsRes } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  // ---- Returns ----
  const [returnsPage, setReturnsPage] = React.useState(1);
  const [returnsStatus, setReturnsStatus] = React.useState<ReturnInvoiceStatus | "all">("all");
  const [returnsCustomer, setReturnsCustomer] = React.useState("");
  const [returnsRep, setReturnsRep] = React.useState("");
  const [issueTarget, setIssueTarget] = React.useState<ReturnInvoice | null>(
    null,
  );

  const returnsHasActiveFilters =
    returnsStatus !== "all" ||
    (!hideCustomerFilter && Boolean(returnsCustomer)) ||
    (!hideRepFilter && Boolean(returnsRep));

  React.useEffect(() => {
    setReturnsPage(1);
  }, [returnsStatus, returnsCustomer, returnsRep]);

  const {
    data: returnsData,
    isLoading: isReturnsLoading,
    isError: isReturnsError,
    refetch: refetchReturns,
  } = useReturnInvoicesQuery({
    page: returnsPage,
    page_size: PAGE_SIZE,
    status: returnsStatus !== "all" ? returnsStatus : undefined,
    customer: customerId ?? (returnsCustomer || undefined),
    rep: repId ?? (returnsRep || undefined),
  });
  const returns = React.useMemo(
    () => returnsData?.data?.return_invoices ?? [],
    [returnsData],
  );
  const returnsPagination = returnsData?.data?.pagination;
  const returnsTotalPages = returnsPagination?.total_pages ?? 1;
  const returnsTotalCount = returnsPagination?.count ?? returns.length;

  // ---- Customer credits ----
  const [creditsPage, setCreditsPage] = React.useState(1);
  const [creditsStatus, setCreditsStatus] = React.useState<CustomerCreditStatus | "all">(
    "pending",
  );
  const [creditsCustomer, setCreditsCustomer] = React.useState("");
  const [creditsRep, setCreditsRep] = React.useState("");
  const [cancelTarget, setCancelTarget] = React.useState<PendingCustomerCredit | null>(
    null,
  );

  const creditsHasActiveFilters =
    creditsStatus !== "pending" ||
    (!hideCustomerFilter && Boolean(creditsCustomer)) ||
    (!hideRepFilter && Boolean(creditsRep));

  React.useEffect(() => {
    setCreditsPage(1);
  }, [creditsStatus, creditsCustomer, creditsRep]);

  const {
    data: creditsData,
    isLoading: isCreditsLoading,
    isError: isCreditsError,
    refetch: refetchCredits,
  } = useCustomerCreditsQuery({
    page: creditsPage,
    page_size: PAGE_SIZE,
    status: creditsStatus !== "all" ? creditsStatus : undefined,
    customer: customerId ?? (creditsCustomer || undefined),
    rep: repId ?? (creditsRep || undefined),
  });
  const credits = React.useMemo(() => creditsData?.data?.credits ?? [], [creditsData]);
  const creditsPagination = creditsData?.data?.pagination;
  const creditsTotalPages = creditsPagination?.total_pages ?? 1;
  const creditsTotalCount = creditsPagination?.count ?? credits.length;

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
          <Badge className="font-normal">{returnsTotalCount}</Badge>
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          يُنشأ المرتجع دائماً من داخل فاتورة البيع الأصلية — افتح الفاتورة من
          تبويب فواتير البيع لتسجيل إرجاع جديد.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            hideSearch
            options={RETURN_STATUS_OPTIONS}
            value={returnsStatus}
            onChange={(v) => setReturnsStatus(v as ReturnInvoiceStatus | "all")}
            placeholder="كل الحالات"
            className="h-8 w-[150px] rounded-lg"
          />

          {!hideCustomerFilter && (
            <SearchableSelect
              options={customerOptions}
              value={returnsCustomer}
              onChange={setReturnsCustomer}
              placeholder="كل الزبائن"
              searchPlaceholder="ابحث عن زبون..."
              className="h-8 w-[170px] rounded-lg"
            />
          )}

          {!hideRepFilter && (
            <SearchableSelect
              options={repOptions}
              value={returnsRep}
              onChange={setReturnsRep}
              placeholder="كل المناديب"
              searchPlaceholder="ابحث عن مندوب..."
              className="h-8 w-[160px] rounded-lg"
            />
          )}

          {returnsHasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReturnsStatus("all");
                setReturnsCustomer("");
                setReturnsRep("");
              }}
              className="gap-1 text-muted-foreground"
            >
              <IconRenderer name="close_outlined" className="size-4" />
              مسح الفلاتر
            </Button>
          )}
        </div>

        <InvoicesDataTable
          columns={returnColumns}
          data={returns}
          pagination={{ page: returnsPage, totalPages: returnsTotalPages }}
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
                  {formatMoney(r.amount, r.currency)}
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
            returnsHasActiveFilters ? (
              <div className="flex w-full flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
                لا توجد مرتجعات مطابقة لهذه الفلاتر
              </div>
            ) : (
              <EmptyState
                variant="invoices"
                size="sm"
                title="لا توجد مرتجعات بعد"
                description="عندما يُرجع زبون بضاعة عبر مندوبه ستظهر فاتورة المرتجع هنا."
              />
            )
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          الأرصدة الدائنة المتاحة للزبائن
          <Badge className="font-normal">{creditsTotalCount}</Badge>
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          رصيد دائن ناتج عن مرتجع تجاوز قيمته المبلغ المتبقي على الفاتورة —
          يُطبَّق يدوياً على فاتورة بيع قادمة، ولا يُخصم تلقائياً.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            hideSearch
            options={CREDIT_STATUS_OPTIONS}
            value={creditsStatus}
            onChange={(v) => setCreditsStatus(v as CustomerCreditStatus | "all")}
            placeholder="كل الحالات"
            className="h-8 w-[150px] rounded-lg"
          />

          {!hideCustomerFilter && (
            <SearchableSelect
              options={customerOptions}
              value={creditsCustomer}
              onChange={setCreditsCustomer}
              placeholder="كل الزبائن"
              searchPlaceholder="ابحث عن زبون..."
              className="h-8 w-[170px] rounded-lg"
            />
          )}

          {!hideRepFilter && (
            <SearchableSelect
              options={repOptions}
              value={creditsRep}
              onChange={setCreditsRep}
              placeholder="مندوب المرتجع (كل المناديب)"
              searchPlaceholder="ابحث عن مندوب..."
              className="h-8 w-[190px] rounded-lg"
            />
          )}

          {creditsHasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreditsStatus("pending");
                setCreditsCustomer("");
                setCreditsRep("");
              }}
              className="gap-1 text-muted-foreground"
            >
              <IconRenderer name="close_outlined" className="size-4" />
              مسح الفلاتر
            </Button>
          )}
        </div>

        <InvoicesDataTable
          columns={creditColumns}
          data={credits}
          pagination={{ page: creditsPage, totalPages: creditsTotalPages }}
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
              {creditsHasActiveFilters
                ? "لا توجد أرصدة دائنة مطابقة لهذه الفلاتر"
                : "لا توجد أرصدة دائنة متاحة حالياً"}
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
