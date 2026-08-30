"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { SalesInvoice } from "../types";
import { formatDate, formatMoney, num } from "../lib/format";
import { LedgerBar } from "./ledger-bar";
import { SalesInvoiceStatusBadge } from "./status-badge";

export function isSalesInvoiceOverdue(
  invoice: SalesInvoice,
  thresholdDays: number,
) {
  if (invoice.status === "fully_paid") return false;
  const ageDays =
    (Date.now() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > thresholdDays;
}

export function createSalesInvoiceColumns({
  thresholdDays,
  onRecordPayment,
  onView,
}: {
  thresholdDays: number;
  onRecordPayment: (invoice: SalesInvoice) => void;
  onView: (invoice: SalesInvoice) => void;
}): ColumnDef<SalesInvoice>[] {
  return [
    {
      accessorKey: "number",
      header: "رقم الفاتورة",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {row.original.number}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.date)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "الزبون",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-foreground">{row.original.customer_name}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.original.customer_phone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "rep_name",
      header: "المندوب",
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.rep_name}</span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "الإجمالي",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {formatMoney(row.original.total_amount)}
        </span>
      ),
    },
    {
      id: "status",
      header: "الحالة والرصيد",
      cell: ({ row }) => {
        const invoice = row.original;
        const isOverdue = isSalesInvoiceOverdue(invoice, thresholdDays);
        return (
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <SalesInvoiceStatusBadge status={invoice.status} isOverdue={isOverdue} />
            <LedgerBar
              size="sm"
              totalAmount={invoice.total_amount}
              paidAmount={invoice.paid_amount}
              returnedAmount={invoice.returned_amount}
              balanceDue={invoice.balance_due}
              overageAmount={invoice.overage_amount}
              isOverdue={isOverdue}
            />
          </div>
        );
      },
    },
    {
      id: "balance_due",
      header: "المتبقي",
      cell: ({ row }) => {
        const balance = num(row.original.balance_due);
        return (
          <span
            className={
              balance > 0
                ? "tabular-nums font-medium text-foreground"
                : "tabular-nums text-muted-foreground"
            }
          >
            {formatMoney(row.original.balance_due)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const invoice = row.original;
        const hasBalance = num(invoice.balance_due) > 0;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <PermissionGate module="invoices" requireAction fallback={null}>
              {hasBalance && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="تسجيل دفعة"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecordPayment(invoice);
                  }}
                >
                  <IconRenderer name="paid_outlined" className="size-4" />
                </Button>
              )}
            </PermissionGate>
            <Button
              variant="ghost"
              size="icon-sm"
              title="عرض الفاتورة"
              onClick={(e) => {
                e.stopPropagation();
                onView(invoice);
              }}
            >
              <IconRenderer name="eye_visible_outlined" className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
