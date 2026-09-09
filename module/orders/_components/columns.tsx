"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { formatDate } from "@/module/invoices/lib/format";
import type { CustomerRequest } from "../types";
import { RequestStatusBadge } from "./status-badge";
import { RepAssignmentCell } from "./rep-assignment-cell";

export function createOrderColumns({
  onView,
  hideCustomerColumn,
}: {
  onView: (request: CustomerRequest) => void;
  /** Omit the "Customer" column when the table is already scoped to one customer (their "orders" tab). */
  hideCustomerColumn?: boolean;
}): ColumnDef<CustomerRequest>[] {
  const customerColumn: ColumnDef<CustomerRequest> = {
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
  };

  return [
    ...(hideCustomerColumn ? [] : [customerColumn]),
    {
      id: "rep",
      header: "المندوب",
      cell: ({ row }) => <RepAssignmentCell request={row.original} />,
    },
    {
      id: "status",
      header: "الحالة",
      cell: ({ row }) => <RequestStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "line_count",
      header: "عدد الأصناف",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {row.original.line_count}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الطلب",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            title="عرض الطلب"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
          >
            <IconRenderer name="eye_visible_outlined" className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
