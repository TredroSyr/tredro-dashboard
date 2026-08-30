"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
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
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { DataTablePagination } from "./data-table-pagination";

interface WarehousesDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState: React.ReactNode;
  onRowClick?: (row: TData) => void;
  renderMobileCard?: (row: TData) => React.ReactNode;
  skeletonRows?: number;
  /** Enables client-side column sorting (e.g. quantity ascending/descending) via a sortable column header. */
  defaultSorting?: SortingState;
  /** Title / search / actions bar rendered above the table, inside the same bordered card — see WarehousesDataTableToolbar. */
  toolbar?: React.ReactNode;
  /** Pass along with onPageChange to paginate `data` client-side (neither the warehouses list nor the stock endpoint paginate server-side — frontend2.md §6). */
  pagination?: { page: number; totalPages: number };
  onPageChange?: (page: number) => void;
}

export function WarehousesDataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyState,
  onRowClick,
  renderMobileCard,
  skeletonRows = 6,
  defaultSorting,
  toolbar,
  pagination,
  onPageChange,
}: WarehousesDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSorting ?? [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-xl border border-border">
      {toolbar}

      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableCell colSpan={columns.length} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <IconRenderer
                      name="warning_outlined"
                      className="h-8 w-8 text-destructive"
                    />
                    <p className="text-sm text-muted-foreground">
                      {errorMessage ?? "حدث خطأ أثناء تحميل البيانات"}
                    </p>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2"
                      >
                        <IconRenderer
                          name="refresh_outlined"
                          className="h-4 w-4"
                        />
                        إعادة المحاولة
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    onRowClick
                      ? "cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                      : "border-b border-border last:border-b-0"
                  }
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
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
                <TableCell colSpan={columns.length} className="h-24 p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="lg:hidden flex flex-col gap-3 px-4 py-3">
        {isError ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
              <IconRenderer
                name="warning_outlined"
                className="h-8 w-8 text-destructive"
              />
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? "حدث خطأ أثناء تحميل البيانات"}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <IconRenderer name="refresh_outlined" className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              )}
            </CardContent>
          </Card>
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <Card
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              <CardContent className="p-4">
                {renderMobileCard?.(row.original)}
              </CardContent>
            </Card>
          ))
        ) : (
          emptyState
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
