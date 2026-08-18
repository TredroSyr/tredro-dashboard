"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

import { Badge } from "@/components/ui/badge";
import { SubUser } from "../types";
import { PhoneInput } from "@/components/tredro/phone-input";

// Fallback for any empty/missing field
const val = (v?: string | null) => (v && v.trim() ? v : "?");

export const columns: ColumnDef<SubUser>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row }) => <Badge variant="outline">{row.index + 1}</Badge>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {val(row.original.name)}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الهاتف" />
    ),
    cell: ({ row }) => <PhoneInput value={row.original.phone} readOnly />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="البريد الإلكتروني" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground" dir="ltr">
        {val(row.original.email) || "-"}
      </span>
    ),
  },
  {
    accessorKey: "role_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الدور" />
    ),
    cell: ({ row }) =>
      row.original.is_owner ? (
        <Badge>مالك الشركة</Badge>
      ) : (
        <span className="text-sm">{val(row.original.role_name)}</span>
      ),
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "destructive"}>
        {row.original.is_active ? "مفعّل" : "موقوف"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
