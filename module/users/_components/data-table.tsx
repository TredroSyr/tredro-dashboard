"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total?: number;
  search: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  pagination?: Pick<PaginatedResponse<TData>, "page" | "totalPages">;
  onPageChange?: (page: number) => void;
  // Optional custom mobile card renderer. If omitted, falls back to
  // auto-rendering every non-"actions" column as a label/value row.
  renderCard?: (row: TData) => React.ReactNode;
  // Column id(s) to treat as row actions and render pinned in the card footer
  actionsColumnId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  search,
  onSearchChange,
  isLoading,
  pagination,
  onPageChange,
  renderCard,
  actionsColumnId = "actions",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-md border border-border">
      <DataTableToolbar
        table={table}
        total={total}
        search={search}
        onSearchChange={onSearchChange}
      />

      {/* Desktop / tablet: table view */}
      <div className="hidden md:block px-6">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows?.length ? (
              rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-gray-500"
                >
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card view */}
      <div className="md:hidden px-4 py-3 flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : rows?.length ? (
          rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-4">
                {renderCard ? (
                  renderCard(row.original)
                ) : (
                  <DefaultCardBody
                    row={row}
                    actionsColumnId={actionsColumnId}
                  />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-sm text-gray-500 py-10">
            لا توجد نتائج
          </p>
        )}
      </div>

      {(pagination || isLoading) && onPageChange && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Fallback card body: renders every visible cell except the "actions"
// column as a label/value line, then pins the actions cell (if any)
// bottom-right — used when no `renderCard` prop is supplied.
function DefaultCardBody<TData>({
  row,
  actionsColumnId,
}: {
  row: ReturnType<
    ReturnType<typeof useReactTable<TData>>["getRowModel"]
  >["rows"][number];
  actionsColumnId: string;
}) {
  const cells = row.getVisibleCells();
  const contentCells = cells.filter((c) => c.column.id !== actionsColumnId);
  const actionsCell = cells.find((c) => c.column.id === actionsColumnId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {contentCells.map((cell) => {
          const header = cell.column.columnDef.header;
          const label = typeof header === "string" ? header : cell.column.id;
          return (
            <div
              key={cell.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-gray-500 shrink-0">{label}</span>
              <span className="font-medium text-foreground text-right">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </span>
            </div>
          );
        })}
      </div>
      {actionsCell && (
        <div className="flex justify-end pt-1 border-t border-border">
          {flexRender(
            actionsCell.column.columnDef.cell,
            actionsCell.getContext(),
          )}
        </div>
      )}
    </div>
  );
}
