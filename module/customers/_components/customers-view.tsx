"use client";

import { Button } from "@/components/ui/button";
import { CheckSquare, X, Filter } from "lucide-react";

import { useState, useMemo, useCallback, useRef } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Customer } from "../types";
import { BulkActionsBar } from "./bulk-assign-bar";
import { CustomerCard } from "./customer-card";
import { useCustomersQuery } from "../hooks";
import {
  MobileFilterDrawer,
} from "./mobile-filter-drawer";
import { CustomersAgendaView } from "./customers-agenda-view";
import { useCustomersViewStore } from "@/store/use-customers-view-store";
import { Badge } from "@/components/ui/badge";
import { Table } from "@tanstack/react-table";
import { PermissionGate } from "@/components/tredro/PermissionGate";

const PAGE_SIZE = 8;

interface CustomersViewProps {
  repId?: string | number;
}

export default function CustomersView({ repId }: CustomersViewProps) {
  const viewMode = useCustomersViewStore((s) => s.viewMode);
  const setViewMode = useCustomersViewStore((s) => s.setViewMode);
  const [search, setSearch] = useState("");
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false);
  const [mobileSelectedIds, setMobileSelectedIds] = useState<Set<number>>(
    new Set(),
  );
  const [filteredCount, setFilteredCount] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Store table instance to pass to filter drawer
  const [tableInstance, setTableInstance] = useState<Table<Customer> | null>(null);

  const {
    data: customersRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomersQuery(repId);

  const customers = customersRes?.data?.customers ?? [];

  // Scoped to a single rep (e.g. opened from that rep's detail page) -
  // filtering by rep within an already rep-scoped list is redundant.
  const hideRepFilter = Boolean(repId);

  // Filter by search string (this is in addition to column filters)
  const searchFilteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.category_details?.name ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleTotalPagesChange = useCallback((totalPages: number) => {
    // Calculate filtered count based on totalPages
    setFilteredCount(totalPages * PAGE_SIZE);
  }, []);

  const handleTableReady = useCallback((table: any) => {
    setTableInstance(table);
  }, []);

  const handleFilterClick = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  // Calculate active filter count from table instance
  const activeFilterCount = useMemo(() => {
    if (!tableInstance) return 0;
    const columnFilters = tableInstance.getState().columnFilters;
    let count = 0;
    for (const filter of columnFilters) {
      if (Array.isArray(filter.value)) {
        count += filter.value.length;
      } else if (typeof filter.value === "string" && filter.value.trim()) {
        count++;
      }
    }
    return count;
  }, [tableInstance, tableInstance?.getState()]);

  const toggleMobileSelect = (id: number) => {
    setMobileSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearMobileSelection = () => {
    setMobileSelectedIds(new Set());
    setMobileSelectionMode(false);
  };

  if (viewMode === "agenda") {
    return (
      <CustomersAgendaView
        customers={searchFilteredCustomers}
        isLoading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hideRepFilter={hideRepFilter}
      />
    );
  }

  return (
    <>
      <DataTable
        data={searchFilteredCustomers}
        columns={columns}
        total={searchFilteredCustomers.length}
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "حدث خطأ أثناء تحميل البيانات"
        }
        onRetry={() => refetch()}
        internalPagination={{
          pageSize: PAGE_SIZE,
          onTotalPagesChange: handleTotalPagesChange,
        }}
        enableRowSelection
        getRowId={(c: Customer) => String(c.id)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hideRepFilter={hideRepFilter}
        defaultRepId={repId}
        renderBulkActions={({ selectedRows, clearSelection }) => (
          <PermissionGate module="customers" requireAction fallback={null}>
            <BulkActionsBar
              selectedCustomers={selectedRows}
              clearSelection={clearSelection}
            />
          </PermissionGate>
        )}
        renderMobileHeader={() =>
          !mobileSelectionMode ? (
            <div className="flex items-center gap-2">
              <PermissionGate module="customers" requireAction fallback={null}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileSelectionMode(true)}
                  className="gap-1.5"
                >
                  <CheckSquare className="size-4" />
                  تحديد
                </Button>
              </PermissionGate>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDrawerOpen(true)}
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
            </div>
          ) : mobileSelectedIds.size === 0 ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <span className="text-sm font-normal text-muted-foreground">
                اضغط مطولاً أو اختر عبر المربع لتحديد عملاء
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMobileSelection}
                className="gap-1 shrink-0"
              >
                <X className="size-4" />
                إلغاء
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5">
              <Badge variant="secondary" className="font-normal">
                {mobileSelectedIds.size} محدد
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMobileSelection}
                className="gap-1 shrink-0"
              >
                <X className="size-4" />
                إلغاء
              </Button>
            </div>
          )
        }
        renderMobileBulkBar={() =>
          mobileSelectedIds.size > 0 ? (
            <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-3">
              <PermissionGate module="customers" requireAction fallback={null}>
                <BulkActionsBar
                  selectedCustomers={searchFilteredCustomers.filter((c) =>
                    mobileSelectedIds.has(c.id)
                  )}
                  clearSelection={clearMobileSelection}
                  variant="compact"
                />
              </PermissionGate>
            </div>
          ) : null
        }
        renderCard={(customer) => (
          <CustomerCard
            customer={customer}
            selectionMode={mobileSelectionMode}
            selected={mobileSelectedIds.has(customer.id)}
            onEnterSelectionMode={() => {
              setMobileSelectionMode(true);
              toggleMobileSelect(customer.id);
            }}
            onToggleSelect={() => toggleMobileSelect(customer.id)}
          />
        )}
        onTableReady={handleTableReady}
        onFilterClick={handleFilterClick}
        activeFilterCount={activeFilterCount}
      />

      {/* Mobile Filter Drawer - render only when we have the table instance */}
      {tableInstance && (
        <MobileFilterDrawer
          open={filterDrawerOpen}
          onOpenChange={setFilterDrawerOpen}
          table={tableInstance}
          hideRepFilter={hideRepFilter}
        />
      )}
    </>
  );
}
