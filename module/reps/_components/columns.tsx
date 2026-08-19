"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

import { Badge } from "@/components/ui/badge";
import { Rep } from "../types";
import { PhoneInput } from "@/components/tredro/phone-input";

const val = (v?: string | null) => (v && v.trim() ? v : "-");

export const columns: ColumnDef<Rep>[] = [
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
    accessorKey: "referral_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="كود الإحالة" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium" dir="ltr">
        {val(row.original.referral_code)}
      </span>
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
