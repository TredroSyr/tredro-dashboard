"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import { useIncomingInvoiceQuery } from "../hooks";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
  num,
} from "../lib/format";
import { DocumentStatusBadge } from "./status-badge";

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

export function IncomingInvoiceDetailSheet({
  invoiceId,
  open,
  onOpenChange,
  onIssue,
  onCancel,
  isIssuing,
  isCancelling,
}: {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssue: (id: number, options?: { onError?: (message: string) => void }) => void;
  onCancel: (id: number, options?: { onError?: (message: string) => void }) => void;
  isIssuing?: boolean;
  isCancelling?: boolean;
}) {
  const isMobile = useIsMobile();
  const { data, isLoading } = useIncomingInvoiceQuery(invoiceId ?? undefined, {
    enabled: open && Boolean(invoiceId),
  });
  const invoice = data?.data?.invoice;
  const [banner, setBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setBanner(null);
  }, [open, invoiceId]);

  const taxTotal = React.useMemo(() => {
    if (!invoice?.lines) return 0;
    return invoice.lines.reduce((sum, line) => {
      const subtotal = num(line.subtotal);
      const rate = num(line.tax_rate);
      return sum + (subtotal * rate) / 100;
    }, 0);
  }, [invoice]);

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "left"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="flex flex-col w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none md:max-w-xl">
        <DrawerHeader className="flex-row items-center justify-between gap-3 px-4 pt-6 pb-3 sm:px-6 sm:pt-4 sticky top-0 z-10 bg-background border-b border-border">
          <DrawerTitle className="text-right text-base sm:text-lg">
            {invoice?.number ?? "فاتورة إدخال"}
          </DrawerTitle>
          <div className="flex items-center gap-2 shrink-0">
            {invoice?.status === "draft" && (
              <PermissionGate module="invoices" requireAction fallback={null}>
                <Button
                  size="sm"
                  disabled={isIssuing}
                  onClick={() => {
                    setBanner(null);
                    onIssue(invoice.id, { onError: setBanner });
                  }}
                  className="gap-1.5"
                >
                  <IconRenderer name="tick_outlined" className="size-3.5" />
                  ترحيل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCancelling}
                  onClick={() => {
                    setBanner(null);
                    onCancel(invoice.id, { onError: setBanner });
                  }}
                >
                  إلغاء
                </Button>
              </PermissionGate>
            )}
            <DrawerClose>
              <Button type="button" variant="ghost" size="icon-sm">
                <IconRenderer name="close_outlined" className="size-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-6 overflow-y-auto flex-1 min-h-0 px-4 py-4 pb-8 sm:px-6 sm:pb-6">
          {banner && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {banner}
            </p>
          )}
          {isLoading || !invoice ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Letterhead */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                <Avatar className="size-11 shrink-0 border border-border">
                  <AvatarImage
                    src={invoice.company_Image || undefined}
                    alt={invoice.company_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <IconRenderer name="no_image_filled" className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {invoice.company_name || "—"}
                  </p>
                  {invoice.tax_registration_no && (
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      الرقم الضريبي: {invoice.tax_registration_no}
                    </p>
                  )}
                </div>
              </div>

              {/* Status + total */}
              <div className="flex items-center justify-between">
                <DocumentStatusBadge status={invoice.status} />
                <span className="tabular-nums text-xl font-semibold text-foreground">
                  {formatMoney(invoice.total_amount)}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5">
                <MetaRow label="تاريخ الفاتورة" value={formatDate(invoice.date)} />
                <MetaRow label="المستودع" value={invoice.warehouse_name} />
                <MetaRow label="المورّد" value={invoice.supplier_ref || "—"} />
                <MetaRow label="تاريخ الإنشاء" value={formatDateTime(invoice.created_at)} />
                {invoice.issued_at && (
                  <MetaRow label="تاريخ الترحيل" value={formatDateTime(invoice.issued_at)} />
                )}
                {invoice.cancelled_at && (
                  <MetaRow label="تاريخ الإلغاء" value={formatDateTime(invoice.cancelled_at)} />
                )}
                <MetaRow label="آخر تحديث" value={formatDateTime(invoice.updated_at)} />
              </div>

              {/* Lines */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">الأصناف</h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-right text-xs text-muted-foreground">
                        <th className="px-3 py-2.5 font-medium">الصنف</th>
                        <th className="px-3 py-2.5 font-medium">الكمية</th>
                        <th className="px-3 py-2.5 font-medium">السعر</th>
                        <th className="px-3 py-2.5 font-medium">الضريبة</th>
                        <th className="px-3 py-2.5 font-medium">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines?.map((line) => (
                        <tr key={line.id} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2.5 text-foreground">
                            {line.product_name}
                            {line.product_sku && (
                              <span className="ms-1.5 text-xs text-muted-foreground">
                                ({line.product_sku})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-foreground">
                            {formatQuantity(line.quantity)} {line.unit_name}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                            {formatMoney(line.unit_price)}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                            {num(line.tax_rate) > 0 ? `${formatQuantity(line.tax_rate)}%` : "—"}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums font-medium text-foreground">
                            {formatMoney(line.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end gap-1.5 self-end text-sm">
                {taxTotal > 0 && (
                  <div className="flex w-56 justify-between text-muted-foreground">
                    <span>إجمالي الضريبة</span>
                    <span className="tabular-nums text-foreground">
                      {formatMoney(taxTotal)}
                    </span>
                  </div>
                )}
                <div className="flex w-56 justify-between border-t border-border pt-1.5 font-semibold text-foreground">
                  <span>الإجمالي</span>
                  <span className="tabular-nums">{formatMoney(invoice.total_amount)}</span>
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
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
