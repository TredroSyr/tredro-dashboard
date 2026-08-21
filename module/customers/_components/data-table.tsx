"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total?: number;
  search: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  pagination?: Pick<PaginatedResponse<TData>, "page" | "totalPages">;
  onPageChange?: (page: number) => void;
  renderCard?: (row: TData) => React.ReactNode;
  actionsColumnId?: string;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  renderBulkActions?: (props: {
    selectedRows: TData[];
    clearSelection: () => void;
  }) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  search,
  onSearchChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  pagination,
  onPageChange,
  renderCard,
  actionsColumnId = "actions",
  enableRowSelection = false,
  getRowId,
  renderBulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    enableRowSelection,
  });

  const rows = table.getRowModel().rows;
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original);

  const clearSelection = () => setRowSelection({});

  return (
    <div className="rounded-md border border-border">
      <DataTableToolbar
        table={table}
        total={total}
        search={search}
        onSearchChange={onSearchChange}
      />

      {enableRowSelection && selectedRows.length > 0 && renderBulkActions && (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          {renderBulkActions({ selectedRows, clearSelection })}
        </div>
      )}

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
            {isError ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-gray-500">
                      {errorMessage ?? "حدث خطأ أثناء تحميل البيانات"}
                    </p>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        إعادة المحاولة
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border">
                  {tableColumns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows?.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
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
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-sm text-gray-500"
                >
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden px-4 py-3 flex flex-col gap-3">
        {isError ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-gray-500">
                {errorMessage ?? "حدث خطأ أثناء تحميل البيانات"}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              )}
            </CardContent>
          </Card>
        ) : isLoading ? (
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

      {!isError && (pagination || isLoading) && onPageChange && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

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
  const contentCells = cells.filter(
    (c) => c.column.id !== actionsColumnId && c.column.id !== "select",
  );
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
