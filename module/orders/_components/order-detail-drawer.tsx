"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { formatDateTime } from "@/module/invoices/lib/format";
import { useCustomerRequestQuery } from "../hooks";
import { formatRequestQuantity, translateUnitName } from "../lib/format";
import { RequestStatusBadge } from "./status-badge";
import { NeedsRepAssignmentBanner } from "./needs-rep-assignment-banner";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function OrderDetailDrawer({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { data, isLoading } = useCustomerRequestQuery(requestId ?? undefined, {
    enabled: open && Boolean(requestId),
  });
  const request = data?.data?.request;

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "left"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="flex flex-col w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl">
        <DrawerHeader className="flex-row items-center justify-between gap-3 px-4 pt-6 pb-3 sm:px-6 sm:pt-4 sticky top-0 z-10 bg-background border-b border-border">
          <DrawerTitle className="text-right text-base sm:text-lg">
            {request?.customer_name ?? "تفاصيل الطلب"}
          </DrawerTitle>
          <DrawerClose>
            <Button type="button" variant="ghost" size="icon-sm">
              <IconRenderer name="close_outlined" className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          {isLoading || !request ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full rounded-xl" />
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

              <div className="flex items-center justify-between">
                <RequestStatusBadge status={request.status} />
                <span className="text-sm text-muted-foreground">
                  {request.line_count} صنف
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
                <MetaRow label="الزبون" value={request.customer_name} />
                <MetaRow
                  label="الهاتف"
                  value={<span dir="ltr">{request.customer_phone}</span>}
                />
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
      </DrawerContent>
    </Drawer>
  );
}
