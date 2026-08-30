"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { PendingCustomerCredit, ReturnInvoice } from "../types";
import { formatDate } from "../lib/format";
import { AmountBadge } from "./amount-badge";
import { CreditStatusBadge, DocumentStatusBadge } from "./status-badge";
import { EntityLink } from "./entity-link";

const REFUND_METHOD_LABEL: Record<string, string> = {
  cash_refunded_by_rep: "أعاد المندوب المبلغ نقداً",
  deferred_customer_credit: "رصيد دائن للزبون",
  "": "—",
};

export function createReturnInvoiceColumns({
  onIssue,
  onView,
}: {
  onIssue: (returnInvoice: ReturnInvoice) => void;
  onView: (returnInvoice: ReturnInvoice) => void;
}): ColumnDef<ReturnInvoice>[] {
  return [
    {
      accessorKey: "number",
      header: "رقم المرتجع",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.number}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.date)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "sales_invoice_number",
      header: "فاتورة البيع الأصلية",
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.sales_invoice_number}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }) => (
        <AmountBadge amount={row.original.amount} currency={row.original.currency} />
      ),
    },
    {
      accessorKey: "refund_method",
      header: "ردّ المبلغ الزائد",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {REFUND_METHOD_LABEL[row.original.refund_method] ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const returnInvoice = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {returnInvoice.status === "draft" && (
              <PermissionGate module="invoices" requireAction fallback={null}>
                <Button
                  size="icon-sm"
                  title="ترحيل"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIssue(returnInvoice);
                  }}
                >
                  <IconRenderer name="tick_outlined" className="size-4" />
                </Button>
              </PermissionGate>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title="عرض فاتورة البيع"
              onClick={(e) => {
                e.stopPropagation();
                onView(returnInvoice);
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

export function createCustomerCreditColumns({
  onCancel,
  hideCustomerColumn,
}: {
  onCancel: (credit: PendingCustomerCredit) => void;
  /** Omit the "Customer" column when the table is already scoped to one customer (e.g. inside their detail page). */
  hideCustomerColumn?: boolean;
}): ColumnDef<PendingCustomerCredit>[] {
  const customerColumn: ColumnDef<PendingCustomerCredit> = {
    accessorKey: "customer_name",
    header: "الزبون",
    cell: ({ row }) => (
      <EntityLink href={`/customers/detail?id=${row.original.customer}`}>
        {row.original.customer_name}
      </EntityLink>
    ),
  };

  return [
    ...(hideCustomerColumn ? [] : [customerColumn]),
    {
      accessorKey: "source_return_invoice_number",
      header: "ناتج عن مرتجع",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.source_return_invoice_number}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }) => <AmountBadge amount={row.original.amount} />,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => <CreditStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const credit = row.original;
        if (credit.status !== "pending") return null;
        return (
          <div className="flex items-center justify-end">
            <PermissionGate module="invoices" requireAction fallback={null}>
              <Button
                size="icon-sm"
                variant="outline"
                title="إلغاء الرصيد"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(credit);
                }}
              >
                <IconRenderer name="close_outlined" className="size-4" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];
}
