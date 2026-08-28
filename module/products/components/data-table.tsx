"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
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
import { AlertCircle, RefreshCw, SearchX } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";

import type { EmptyStateVariant } from "@/lib/illustrations";
import { EmptyState } from "@/components/tredro/empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total?: number;
  hasAnyData: boolean;
  emptyStateVariant: EmptyStateVariant;
  search: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;

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
  hasAnyData,
  emptyStateVariant,
  search,
  onSearchChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
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
  const hasActiveSearch = search.trim().length > 0;

  return (
    <div className="rounded-md border border-border">
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <DataTableToolbar
          table={table}
          total={total}
          search={search}
          onSearchChange={onSearchChange}
        />
      </div>

      <div className="py-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr gap-x-4 gap-y-4 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="relative w-full pt-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr gap-x-4 gap-y-4 px-2">
            {rows.map((row) =>
              renderCard ? (
                <React.Fragment key={row.id}>
                  {renderCard(row.original)}
                </React.Fragment>
              ) : (
                <Card
                  key={row.id}
                  className="relative w-full h-full flex flex-col pt-0"
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
                  <CardHeader className="flex-1">
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
        ) : !hasAnyData ? (
          <EmptyState variant={emptyStateVariant} size="sm" />
        ) : hasActiveSearch ? (
          <div className="flex w-full flex-col items-center justify-center rounded-xl px-6 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-base font-bold text-foreground">
              لا توجد نتائج مطابقة
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
              جرّب كلمات بحث مختلفة أو امسح البحث للعودة لكل النتائج.
            </p>
            {onSearchChange && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                مسح البحث
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
