"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/module/reps/_components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { EditableTextCell } from "./editable-text-cell";
import { EditablePhoneCell } from "./editable-phone-cell";
import { EditableStatusCell } from "./editable-status-cell";
import { CategoryCell } from "./category-cell";
import { WorkDaysCell } from "./work-days-cell";
import { Customer } from "../types";
import { PhoneInput } from "@/components/tredro/phone-input";
import { WORK_DAYS } from "./work-day-picker";

// Work day filter options - using full Arabic names
const WORK_DAY_FILTER_OPTIONS = WORK_DAYS.map((d) => ({
  label: d.label,
  value: d.value,
}));

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
    cell: ({ row }) => <PhoneInput value={row.original.phone} readOnly />,
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
    id: "work_days",
    accessorFn: (row) => {
      // Collect all work days from assigned reps for filtering
      const days: string[] = [];
      for (const rep of row.assigned_reps_details ?? []) {
        if (rep.work_days) {
          for (const day of rep.work_days) {
            if (!days.includes(day)) {
              days.push(day);
            }
          }
        }
      }
      return days;
    },
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="أيام الزيارة"
        type="filter"
        options={WORK_DAY_FILTER_OPTIONS}
      />
    ),
    cell: ({ row }) => <WorkDaysCell customer={row.original} />,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true;
      const customerDays = row.getValue(id) as string[];
      // If no work days defined, still show (uses rep default)
      if (customerDays.length === 0) return true;
      // Check if customer has at least one of the filter days
      return filterValue.some((day) => customerDays.includes(day));
    },
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
    cell: ({ row }) => <EditableStatusCell customer={row.original} />,
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
