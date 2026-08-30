"use client";

import * as React from "react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { cn } from "@/lib/utils";
import {
  useInvoiceSettingsQuery,
  useReturnInvoiceQuery,
  useSalesInvoiceQuery,
} from "../hooks";
import { InvoiceDetailHeader } from "./invoice-detail-header";
import { InvoiceHistoryTimeline } from "./invoice-history-timeline";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { CreateReturnDrawer } from "./create-return-drawer";
import { IssueReturnDialog } from "./issue-return-dialog";
import { DocumentStatusBadge } from "./status-badge";
import { formatDate, formatDateTime, formatMoney, formatQuantity, num } from "../lib/format";
import type { SalesInvoice } from "../types";

type DetailTabValue = "overview" | "payments" | "returns" | "history";

const TABS: { value: DetailTabValue; label: string; icon: iconName }[] = [
  { value: "overview", label: "نظرة عامة", icon: "overview_outlined" },
  { value: "payments", label: "الدفعات", icon: "transaction_outlined" },
  { value: "returns", label: "المرتجعات", icon: "undo_outlined" },
  { value: "history", label: "السجل", icon: "activity_log_outlined" },
];

export function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const [activeTab, setActiveTab] = React.useState<DetailTabValue>("overview");
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [returnDrawerOpen, setReturnDrawerOpen] = React.useState(false);
  const [issueReturnId, setIssueReturnId] = React.useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useSalesInvoiceQuery(invoiceId);
  const invoice = data?.data?.invoice;

  const { data: settingsData } = useInvoiceSettingsQuery();
  const thresholdDays = settingsData?.data?.settings?.overdue_threshold_days ?? 7;

  const { data: issueReturnData } = useReturnInvoiceQuery(issueReturnId ?? undefined, {
    enabled: Boolean(issueReturnId),
  });

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل الفاتورة"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!isLoading && !invoice) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay title="الفاتورة غير موجودة" message="الفاتورة التي تحاول الوصول إليها غير موجودة أو تم حذفها" />
      </div>
    );
  }

  return (
    <div>
      <InvoiceDetailHeader
        invoice={invoice}
        isLoading={isLoading}
        thresholdDays={thresholdDays}
        onRecordPayment={() => setPaymentOpen(true)}
        onCreateReturn={() => setReturnDrawerOpen(true)}
      />

      <div className="px-6 py-4">
        {isLoading ? (
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible"
            dir="rtl"
          >
            {TABS.map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-14 rounded-xl border", "w-[65%] xs:w-[45%] sm:w-full")}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible"
            dir="rtl"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex shrink-0 cursor-pointer snap-start items-center gap-2 rounded-xl border px-4 py-3 text-right transition-colors",
                    "w-[65%] xs:w-[45%] sm:w-auto",
                    isActive
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <IconRenderer name={tab.icon} className="size-4 shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 pb-8 sm:px-6">
        {isLoading || !invoice ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab invoice={invoice} />}
            {activeTab === "payments" && <PaymentsTab invoice={invoice} />}
            {activeTab === "returns" && (
              <ReturnsTab invoice={invoice} onIssue={setIssueReturnId} />
            )}
            {activeTab === "history" && (
              <InvoiceHistoryTimeline invoiceId={invoice.id} />
            )}
          </>
        )}
      </div>

      <RecordPaymentDialog
        invoice={invoice ?? null}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />

      <CreateReturnDrawer
        invoice={invoice ?? null}
        open={returnDrawerOpen}
        onOpenChange={setReturnDrawerOpen}
        onCreated={() => setActiveTab("returns")}
      />

      <IssueReturnDialog
        returnInvoice={issueReturnData?.data?.return_invoice ?? null}
        open={Boolean(issueReturnId)}
        onOpenChange={(open) => !open && setIssueReturnId(null)}
        onIssued={() => setIssueReturnId(null)}
      />
    </div>
  );
}

function OverviewTab({ invoice }: { invoice: SalesInvoice }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">الصنف</th>
              <th className="px-4 py-2.5 font-medium">الكمية</th>
              <th className="px-4 py-2.5 font-medium">سعر الوحدة</th>
              <th className="px-4 py-2.5 font-medium">المرتجع</th>
              <th className="px-4 py-2.5 font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines?.map((line) => (
              <tr key={line.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-foreground">
                  {line.product_name}
                  {line.product_sku && (
                    <span className="ms-1.5 text-xs text-muted-foreground">
                      ({line.product_sku})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-foreground">
                  {formatQuantity(line.quantity)} {line.unit_name}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatMoney(line.unit_price, invoice.currency)}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {num(line.returned_quantity) > 0
                    ? formatQuantity(line.returned_quantity)
                    : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                  {formatMoney(line.subtotal, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end gap-1.5 self-end text-sm">
        <div className="flex w-56 justify-between text-muted-foreground">
          <span>الإجمالي</span>
          <span className="tabular-nums text-foreground">
            {formatMoney(invoice.total_amount, invoice.currency)}
          </span>
        </div>
        <div className="flex w-56 justify-between text-muted-foreground">
          <span>المدفوع</span>
          <span className="tabular-nums text-foreground">
            {formatMoney(invoice.paid_amount, invoice.currency)}
          </span>
        </div>
        <div className="flex w-56 justify-between text-muted-foreground">
          <span>المرتجع</span>
          <span className="tabular-nums text-foreground">
            {formatMoney(invoice.returned_amount, invoice.currency)}
          </span>
        </div>
        <div className="flex w-56 justify-between border-t border-border pt-1.5 font-semibold text-foreground">
          <span>المتبقي</span>
          <span className="tabular-nums">{formatMoney(invoice.balance_due, invoice.currency)}</span>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">ملاحظات</h3>
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">
            {invoice.notes}
          </p>
        </div>
      )}

      {invoice.fulfilled_request_ids && invoice.fulfilled_request_ids.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">
            استجابت هذه الفاتورة لطلبات استرشادية
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {invoice.fulfilled_request_ids.map((id) => (
              <Badge key={id} variant="outline">
                طلب #{id}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ invoice }: { invoice: SalesInvoice }) {
  const payments = invoice.payments ?? [];

  if (payments.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        لا توجد دفعات مسجّلة بعد على هذه الفاتورة
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between rounded-xl border border-border p-3.5"
        >
          <div>
            <p className="font-medium text-foreground">
              {formatMoney(payment.amount, invoice.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {payment.collected_by_name ?? "تحصيل مباشر من الشركة"} ·{" "}
              {formatDateTime(payment.collected_at)}
              {payment.source === "customer_credit" && " · من رصيد دائن"}
            </p>
            {payment.note && (
              <p className="mt-1 text-xs text-muted-foreground">{payment.note}</p>
            )}
          </div>
          <Badge variant={payment.source === "cash" ? "success" : "secondary"}>
            {payment.source === "cash" ? "نقدي" : "رصيد دائن"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function ReturnsTab({
  invoice,
  onIssue,
}: {
  invoice: SalesInvoice;
  onIssue: (id: number) => void;
}) {
  const returns = invoice.returns ?? [];

  if (returns.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        لم يُسجَّل أي مرتجع على هذه الفاتورة بعد
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {returns.map((ret) => (
        <div
          key={ret.id}
          className="flex items-center justify-between rounded-xl border border-border p-3.5"
        >
          <div>
            <p className="font-medium text-foreground">{ret.number}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(ret.amount, invoice.currency)}
              {ret.issued_at && ` · ${formatDateTime(ret.issued_at)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DocumentStatusBadge status={ret.status} />
            {ret.status === "draft" && (
              <Button size="sm" onClick={() => onIssue(ret.id)}>
                ترحيل
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
