"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { EditableTextCell } from "./editable-text-cell";
import { EditablePhoneCell } from "./editable-phone-cell";
import { EditableStatusCell } from "./editable-status-cell";
import { CategoryCell } from "./category-cell";
import { WorkDaysCell } from "./work-days-cell";
import { Customer, AssignedRepDetail } from "../types";
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
    size: 20,
    minSize: 20,
    maxSize: 20,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" type="text" />
    ),
    cell: ({ row }) => (
      <EditableTextCell
        value={row.original.name}
        onSave={(v) => ({ id: row.original.id, name: v })}
        maxWidth="120px"
      />
    ),
    filterFn: (row, id, filterValue: string) => {
      if (!filterValue?.trim()) return true;
      const value = row.getValue(id) as string;
      return value.toLowerCase().includes(filterValue.toLowerCase());
    },
    size: 150,
    minSize: 100,
    maxSize: 200,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الهاتف" type="text" />
    ),
    cell: ({ row }) => <PhoneInput value={row.original.phone} readOnly />,
    filterFn: (row, id, filterValue: string) => {
      if (!filterValue?.trim()) return true;
      const value = row.getValue(id) as string;
      return value.toLowerCase().includes(filterValue.toLowerCase());
    },
    size: 100,
    minSize: 100,
    maxSize: 160,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="البريد الإلكتروني" type="text" />
    ),
    cell: ({ row }) => (
      <EditableTextCell
        value={row.original.email ?? ""}
        placeholder="-"
        dir="ltr"
        onSave={(v) => ({ id: row.original.id, email: v })}
        maxWidth="150px"
      />
    ),
    filterFn: (row, id, filterValue: string) => {
      if (!filterValue?.trim()) return true;
      const value = (row.getValue(id) as string) ?? "";
      return value.toLowerCase().includes(filterValue.toLowerCase());
    },
    size: 180,
    minSize: 120,
    maxSize: 250,
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
    size: 100,
    minSize: 80,
    maxSize: 140,
  },
  {
    id: "assigned_reps",
    accessorFn: (row) => {
      // Return array of rep IDs for filtering (as strings)
      return (row.assigned_reps_details ?? []).map((r) => String(r.id));
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المندوبون" />
    ),
    cell: ({ row }) => <AssignRepCell customer={row.original} />,
    filterFn: (row, id, filterValue: string[]) => {
      // filterValue is array of selected rep IDs (strings)
      if (!filterValue?.length) return true;
      const customerRepIds = row.getValue(id) as string[];
      // Check if customer has at least one of the selected reps
      return filterValue.some((repId) => customerRepIds.includes(repId));
    },
    size: 280,
    minSize: 200,
    maxSize: 350,
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
    size: 120,
    minSize: 100,
    maxSize: 150,
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
    size: 90,
    minSize: 70,
    maxSize: 100,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    size: 80,
    minSize: 70,
    maxSize: 100,
  },
];
