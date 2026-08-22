"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/module/reps/_components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { EditableTextCell } from "./editable-text-cell";
import { EditablePhoneCell } from "./editable-phone-cell";
import { CategoryCell } from "./category-cell";

import { Badge } from "@/components/ui/badge";
import { Customer } from "../types";

export const columns: ColumnDef<Customer>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row }) => (
      <span className="text-sm font-normal text-muted-foreground">
        {row.index + 1}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <EditableTextCell
        value={row.original.name}
        onSave={(v) => ({ id: row.original.id, name: v })}
      />
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الهاتف" />
    ),
    cell: ({ row }) => <EditablePhoneCell customer={row.original} />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="البريد الإلكتروني" />
    ),
    cell: ({ row }) => (
      <EditableTextCell
        value={row.original.email ?? ""}
        placeholder="-"
        dir="ltr"
        onSave={(v) => ({ id: row.original.id, email: v })}
      />
    ),
  },
  {
    id: "category",
    accessorFn: (row) => row.category_details?.id ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التصنيف" />
    ),
    cell: ({ row }) => <CategoryCell customer={row.original} />,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(String(row.getValue(id)));
    },
  },
  {
    id: "assigned_reps",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المندوبون" />
    ),
    cell: ({ row }) => <AssignRepCell customer={row.original} />,
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الحالة"
        type="filter"
        options={[
          { label: "مفعّل", value: "true" },
          { label: "موقوف", value: "false" },
        ]}
      />
    ),
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active ? "default" : "destructive"}
        className="font-normal"
      >
        {row.original.is_active ? "مفعّل" : "موقوف"}
      </Badge>
    ),
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      return filterValue.includes(String(row.getValue(id)));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
