"use client";

import * as React from "react";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { formatDateTime } from "@/module/invoices/lib/format";
import { useCustomerRequestQuery } from "../hooks";
import { formatRequestQuantity, translateUnitName } from "../lib/format";
import { OrderDetailHeader } from "./order-detail-header";
import { NeedsRepAssignmentBanner } from "./needs-rep-assignment-banner";

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function OrderDetailClient({ requestId }: { requestId: string }) {
  const { data, isLoading, isError, refetch } = useCustomerRequestQuery(requestId);
  const request = data?.data?.request;

  if (isError) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="حدث خطأ أثناء تحميل بيانات الطلب"
          message="يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!isLoading && !request) {
    return (
      <div className="px-6 py-8">
        <ErrorDisplay
          title="الطلب غير موجود"
          message="الطلب الذي تحاول الوصول إليه غير موجود أو تم حذفه"
        />
      </div>
    );
  }

  return (
    <div>
      <OrderDetailHeader
        customerName={request?.customer_name}
        customerPhone={request?.customer_phone}
        status={request?.status}
        lineCount={request?.line_count}
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        {isLoading || !request ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {request.needs_rep_assignment && (
              <NeedsRepAssignmentBanner
                customerId={request.customer}
                customerName={request.customer_name}
              />
            )}

            <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
              <MetaRow
                label="المندوب عند تقديم الطلب"
                value={request.rep_name ?? "لم يُرسَل لأحد"}
              />
              <MetaRow label="تاريخ الطلب" value={formatDateTime(request.created_at)} />
              {request.accepted_at && (
                <MetaRow label="تاريخ القبول" value={formatDateTime(request.accepted_at)} />
              )}
              {request.rejected_at && (
                <MetaRow label="تاريخ الرفض" value={formatDateTime(request.rejected_at)} />
              )}
              {request.fulfilled_at && (
                <MetaRow label="تاريخ التسليم" value={formatDateTime(request.fulfilled_at)} />
              )}
              {request.cancelled_at && (
                <MetaRow label="تاريخ الإلغاء" value={formatDateTime(request.cancelled_at)} />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">الأصناف المطلوبة</h3>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">الصنف</th>
                      <th className="px-3 py-2.5 font-medium">الكمية المطلوبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.lines.map((line) => (
                      <tr key={line.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2.5 text-foreground">
                          <EntityLink href={`/products/detail?id=${line.product}`}>
                            {line.product_name}
                          </EntityLink>
                          {line.product_sku && (
                            <span className="ms-1.5 text-xs text-muted-foreground">
                              ({line.product_sku})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground">
                          {formatRequestQuantity(line.desired_quantity)}{" "}
                          {translateUnitName(line.unit_name)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                الطلب إشارة اهتمام غير مسعّرة — لا يوجد سعر متفق عليه حتى تُنشأ فاتورة بيع.
              </p>
            </div>

            {request.notes && (
              <div>
                <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">ملاحظات العميل</h3>
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                  {request.notes}
                </p>
              </div>
            )}

            {request.status === "rejected" && request.rejection_reason && (
              <div>
                <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">سبب الرفض</h3>
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {request.rejection_reason}
                </p>
              </div>
            )}

            {request.status === "fulfilled" && request.fulfilled_by_invoice_number && (
              <div className="rounded-lg bg-green-600/10 p-3 text-sm text-green-600 dark:bg-green-400/10 dark:text-green-400">
                نُفِّذ عبر الفاتورة{" "}
                <EntityLink href={`/invoices/detail?id=${request.fulfilled_by_invoice}`}>
                  {request.fulfilled_by_invoice_number}
                </EntityLink>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
