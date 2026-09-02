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
import type { StockTransfer } from "../types";
import { formatDateTime, calculateRemainingTime } from "../lib/format";
import { StockTransferStatusBadge } from "./status-badge";

const CANCELLABLE_STATUSES = new Set([
  "pending",
  "modified_by_admin",
  "pending_rep_confirmation",
  "confirmed",
]);

export function createTransferColumns({
  onApprove,
  onModify,
  onCancel,
  onView,
  isApproving,
  isCancelling,
}: {
  onApprove: (transfer: StockTransfer) => void;
  onModify: (transfer: StockTransfer) => void;
  onCancel: (transfer: StockTransfer) => void;
  onView: (transfer: StockTransfer) => void;
  isApproving?: boolean;
  isCancelling?: boolean;
}): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorKey: "number",
      header: "رقم الطلب",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground tabular-nums" dir="ltr">
            {row.original.number}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.requested_at)}
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
      id: "route",
      header: "المسار",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.source_warehouse_name} ← {row.original.destination_warehouse_name}
        </span>
      ),
    },
    {
      id: "pickup_deadline",
      header: "وقت الاستلام",
      cell: ({ row }) => {
        const remaining = calculateRemainingTime(row.original.pickup_deadline);
        const isExpired = remaining === "انتهى الوقت";
        return (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${
              isExpired ? "text-destructive" : "text-foreground"
            }`}>
              {remaining}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(row.original.pickup_deadline)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "line_count",
      header: "عدد الأصناف",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground" dir="ltr">
          {row.original.line_count ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => <StockTransferStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const transfer = row.original;
        const canAct =
          transfer.status === "pending" || CANCELLABLE_STATUSES.has(transfer.status);
        return (
          <div className="flex items-center justify-end gap-1">
            {canAct && (
              <PermissionGate module="invoices" requireAction fallback={null}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="إجراءات الطلب"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconRenderer name="more_outlined" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {transfer.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          disabled={isApproving}
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(transfer);
                          }}
                        >
                          <IconRenderer name="tick_outlined" className="size-4" />
                          الموافقة على الكميات المطلوبة
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onModify(transfer);
                          }}
                        >
                          <IconRenderer name="edit_outlined" className="size-4" />
                          تعديل الكميات
                        </DropdownMenuItem>
                      </>
                    )}
                    {CANCELLABLE_STATUSES.has(transfer.status) && (
                      <DropdownMenuItem
                        disabled={isCancelling}
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancel(transfer);
                        }}
                      >
                        <IconRenderer name="close_outlined" className="size-4" />
                        إلغاء الطلب
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGate>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title="عرض التفاصيل"
              onClick={(e) => {
                e.stopPropagation();
                onView(transfer);
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
