"use client";
import * as React from "react";
import { Plus, Search, X, Filter, List, CalendarDays } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CustomerFormDrawer } from "./actions-drawer";
import { ImportExcelDialog } from "./import-excel-dialog";
import { CategoryFilterPopover } from "./category-filter-popover";
import { RepFilterPopover } from "./rep-filter-popover";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { CustomersViewMode } from "./customers-view-mode";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  total?: number;
  search: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  viewMode?: CustomersViewMode;
  onViewModeChange?: (mode: CustomersViewMode) => void;
  /** Hides the "filter by rep" control - used when the list is already scoped to one rep. */
  hideRepFilter?: boolean;
  /** Pre-selects this rep when creating a customer from this view (e.g. a rep's detail page). */
  defaultRepId?: number | string;
}

export function DataTableToolbar<TData>({
  table,
  total,
  search,
  onSearchChange,
  onFilterClick,
  activeFilterCount = 0,
  viewMode,
  onViewModeChange,
  hideRepFilter = false,
  defaultRepId,
}: DataTableToolbarProps<TData>) {
  const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);

  const isFiltered = table.getState().columnFilters.length > 0 || activeFilterCount > 0;
  const categoryColumn = table.getColumn("category");
  const repsColumn = table.getColumn("assigned_reps");

  const categoryFilterValue =
    (categoryColumn?.getFilterValue() as string[]) ?? [];
  const repsFilterValue =
    (repsColumn?.getFilterValue() as string[]) ?? [];

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 sm:px-6 py-6 border-border">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span>العملاء</span>
          {total !== undefined && (
            <Badge className="font-normal">{total} عميل</Badge>
          )}
        </h1>

        {onViewModeChange && (
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewModeChange("table")}
              title="عرض جدول"
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "agenda" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewModeChange("agenda")}
              title="عرض الجدول الزمني"
            >
              <CalendarDays className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between py-4 px-4 sm:px-6 gap-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full xs:w-[220px] sm:w-[280px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ابحث عن عميل..."
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* Desktop filters - visible on lg screens and above */}
          <div className="hidden lg:flex items-center gap-2">
            <CategoryFilterPopover
              value={categoryFilterValue}
              onChange={(v) =>
                categoryColumn?.setFilterValue(v.length ? v : undefined)
              }
            />

            {!hideRepFilter && (
              <RepFilterPopover
                value={repsFilterValue}
                onChange={(v) =>
                  repsColumn?.setFilterValue(v.length ? v : undefined)
                }
              />
            )}
          </div>

          {/* Mobile filter button - visible only on screens below lg */}
          <div className="lg:hidden">
            {onFilterClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFilterClick}
                className="gap-1.5"
              >
                <Filter className="size-4" />
                فلترة
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-1.5 h-5 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="gap-1 text-muted-foreground"
            >
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PermissionGate module="customers" requireAction fallback={null}>
            <ImportExcelDialog />
            <Button size="sm" onClick={() => setAddDrawerOpen(true)}>
              <Plus className="size-4" />
              إضافة عميل
            </Button>
          </PermissionGate>
        </div>
      </div>

      <CustomerFormDrawer
        mode="create"
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        defaultRepId={defaultRepId}
      />
    </>
  );
}
