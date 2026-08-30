"use client";

import * as React from "react";
import { toast } from "sonner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { iconName } from "@/assets/icons/iconRenderer/types";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/hooks/use-api-form-error";
import {
  useCancelIncomingInvoiceMutation,
  useIncomingInvoiceQuery,
  useIssueIncomingInvoiceMutation,
} from "../hooks";
import { EntityLink } from "./entity-link";
import { IncomingInvoiceDetailHeader } from "./incoming-invoice-detail-header";
import { IncomingInvoiceHistoryTimeline } from "./incoming-invoice-history-timeline";
import { formatMoney, formatQuantity, num } from "../lib/format";
import type { IncomingInvoice } from "../types";

type DetailTabValue = "overview" | "history";

const TABS: { value: DetailTabValue; label: string; icon: iconName }[] = [
  { value: "overview", label: "نظرة عامة", icon: "overview_outlined" },
  { value: "history", label: "السجل", icon: "activity_log_outlined" },
];

export function IncomingInvoiceDetailClient({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const [activeTab, setActiveTab] = React.useState<DetailTabValue>("overview");

  const { data, isLoading, isError, refetch } = useIncomingInvoiceQuery(invoiceId);
  const invoice = data?.data?.invoice;

  const { mutate: issueInvoice, isPending: isIssuing } =
    useIssueIncomingInvoiceMutation();
  const { mutate: cancelInvoice, isPending: isCancelling } =
    useCancelIncomingInvoiceMutation();

  const handleIssue = () => {
    if (!invoice) return;
    issueInvoice(invoice.id, {
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const handleCancel = () => {
    if (!invoice) return;
    cancelInvoice(invoice.id, {
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل فاتورة الإدخال"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!isLoading && !invoice) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="فاتورة الإدخال غير موجودة"
          message="فاتورة الإدخال التي تحاول الوصول إليها غير موجودة أو تم حذفها"
        />
      </div>
    );
  }

  return (
    <div>
      <IncomingInvoiceDetailHeader
        invoice={invoice}
        isLoading={isLoading}
        onIssue={handleIssue}
        onCancel={handleCancel}
        isIssuing={isIssuing}
        isCancelling={isCancelling}
      />

      <div className="px-6 py-4">
        {isLoading ? (
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible"
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
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible"
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
            {activeTab === "history" && (
              <IncomingInvoiceHistoryTimeline invoiceId={invoice.id} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ invoice }: { invoice: IncomingInvoice }) {
  const taxTotal = React.useMemo(() => {
    if (!invoice.lines) return 0;
    return invoice.lines.reduce((sum, line) => {
      const subtotal = num(line.subtotal);
      const rate = num(line.tax_rate);
      return sum + (subtotal * rate) / 100;
    }, 0);
  }, [invoice]);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">الصنف</th>
              <th className="px-4 py-2.5 font-medium">الكمية</th>
              <th className="px-4 py-2.5 font-medium">السعر</th>
              <th className="px-4 py-2.5 font-medium">الضريبة</th>
              <th className="px-4 py-2.5 font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines?.map((line) => (
              <tr key={line.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-foreground">
                  <EntityLink href={`/products/detail?id=${line.product}`}>
                    {line.product_name}
                  </EntityLink>
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
                  {num(line.tax_rate) > 0 ? `${formatQuantity(line.tax_rate)}%` : "—"}
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
        {taxTotal > 0 && (
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>إجمالي الضريبة</span>
            <span className="tabular-nums text-foreground">
              {formatMoney(taxTotal, invoice.currency)}
            </span>
          </div>
        )}
        <div className="flex w-56 justify-between border-t border-border pt-1.5 font-semibold text-foreground">
          <span>الإجمالي</span>
          <span className="tabular-nums">
            {formatMoney(invoice.total_amount, invoice.currency)}
          </span>
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
    </div>
  );
}
