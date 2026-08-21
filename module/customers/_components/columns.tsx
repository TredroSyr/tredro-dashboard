"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/module/reps/_components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

import { Badge } from "@/components/ui/badge";
import { Customer } from "../types";
import { PhoneInput } from "@/components/tredro/phone-input";

const val = (v?: string | null) => (v && v.trim() ? v : "-");

export const columns: ColumnDef<Customer>[] = [
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
        {val(row.original.email)}
      </span>
    ),
  },
  {
    accessorKey: "assigned_rep_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المندوب" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {val(row.original.assigned_rep_name)}
      </span>
    ),
  },
  {
    accessorKey: "referral_code_used",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="كود الإحالة"
        description="الكود الذي استخدمه العميل عند التسجيل، ثابت ولا يتغير"
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium" dir="ltr">
        {val(row.original.referral_code_used)}
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
