"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { IncomingInvoice } from "../types";
import { formatDate } from "../lib/format";
import { AmountBadge } from "./amount-badge";
import { DocumentStatusBadge } from "./status-badge";

export function createIncomingInvoiceColumns({
  onIssue,
  onCancel,
  onView,
  isIssuing,
  isCancelling,
}: {
  onIssue: (invoice: IncomingInvoice) => void;
  onCancel: (invoice: IncomingInvoice) => void;
  onView: (invoice: IncomingInvoice) => void;
  isIssuing?: boolean;
  isCancelling?: boolean;
}): ColumnDef<IncomingInvoice>[] {
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
      accessorKey: "warehouse_name",
      header: "المستودع",
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.warehouse_name}</span>
      ),
    },
    {
      accessorKey: "supplier_ref",
      header: "المورد",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.supplier_ref || "—"}
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
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {invoice.status === "draft" && (
              <PermissionGate module="invoices" requireAction fallback={null}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="إجراءات الفاتورة: ترحيل أو إلغاء"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconRenderer name="menu_outlined" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuItem
                      disabled={isIssuing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onIssue(invoice);
                      }}
                    >
                      <IconRenderer name="tick_outlined" className="size-4" />
                      ترحيل الفاتورة — اضافة الكمية لمستودع الشركة
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isCancelling}
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(invoice);
                      }}
                    >
                      <IconRenderer name="close_outlined" className="size-4" />
                      إلغاء الفاتورة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title="عرض تفاصيل الفاتورة"
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
