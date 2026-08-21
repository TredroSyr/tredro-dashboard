"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/module/reps/_components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { EditableNameCell } from "./editable-name-cell";
import { CategoryCell } from "./category-cell";

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
    cell: ({ row }) => <EditableNameCell customer={row.original} />,
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
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التصنيف" />
    ),
    cell: ({ row }) => <CategoryCell customer={row.original} />,
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
      <Badge variant={row.original.is_active ? "default" : "destructive"}>
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
