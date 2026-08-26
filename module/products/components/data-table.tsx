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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  // كيف نبني الكارت من بيانات كل صف
  getImage?: (row: TData) => string | undefined;
  getBadge?: (row: TData) => string | undefined;
  getTitle: (row: TData) => React.ReactNode;
  getDescription?: (row: TData) => React.ReactNode;
  getActionLabel?: (row: TData) => string;
  onAction?: (row: TData) => void;

  renderCard?: (row: TData) => React.ReactNode;
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
  getImage,
  getBadge,
  getTitle,
  getDescription,
  getActionLabel,
  onAction,
  renderCard,
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

      <div className=" py-4">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
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
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="relative w-full max-w-sm pt-0">
                <Skeleton className="aspect-video w-full rounded-t-xl rounded-b-none" />
                <CardHeader>
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : rows?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {rows.map((row) =>
              renderCard ? (
                <React.Fragment key={row.id}>
                  {renderCard(row.original)}
                </React.Fragment>
              ) : (
                <Card
                  key={row.id}
                  className="relative mx-auto w-full max-w-sm pt-0"
                >
                  {getImage?.(row.original) && (
                    <>
                      <div className="absolute inset-0 z-30 aspect-video bg-black/35 rounded-t-xl" />
                      <img
                        src={getImage(row.original)}
                        alt=""
                        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40 rounded-t-xl"
                      />
                    </>
                  )}
                  <CardHeader>
                    {getBadge?.(row.original) && (
                      <CardAction>
                        <Badge variant="secondary">
                          {getBadge(row.original)}
                        </Badge>
                      </CardAction>
                    )}
                    <CardTitle>{getTitle(row.original)}</CardTitle>
                    {getDescription && (
                      <CardDescription>
                        {getDescription(row.original)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {getActionLabel && onAction && (
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => onAction(row.original)}
                      >
                        {getActionLabel(row.original)}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ),
            )}
          </div>
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
