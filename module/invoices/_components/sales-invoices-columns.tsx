"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { SalesInvoice } from "../types";
import { formatDate, formatRepName, num } from "../lib/format";
import { AmountBadge } from "./amount-badge";
import { EntityLink } from "./entity-link";
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
          <EntityLink href={`/customers/detail?id=${row.original.customer}`}>
            {row.original.customer_name}
          </EntityLink>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.original.customer_phone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "rep_name",
      header: "المندوب",
      cell: ({ row }) =>
        row.original.rep ? (
          <EntityLink href={`/reps/detail?id=${row.original.rep}`}>
            {formatRepName(row.original.rep_name)}
          </EntityLink>
        ) : (
          <span className="text-foreground">
            {formatRepName(row.original.rep_name)}
          </span>
        ),
    },
    {
      accessorKey: "total_amount",
      header: "الإجمالي",
      cell: ({ row }) => (
        <AmountBadge
          amount={row.original.total_amount}
          currency={row.original.currency}
        />
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
              currency={invoice.currency}
              isOverdue={isOverdue}
            />
          </div>
        );
      },
    },
    {
      id: "balance_due",
      header: "المتبقي",
      cell: ({ row }) => (
        <AmountBadge
          amount={row.original.balance_due}
          currency={row.original.currency}
        />
      ),
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
