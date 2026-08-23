"use client";

import { columns } from "@/module/customers/_components/columns";

import { FloatingBulkBar } from "@/module/customers/_components/floating-bulk-bar";
import { CustomerCard } from "@/module/customers/_components/customer-card";
import { useCustomersQuery } from "@/module/customers/hooks";
import { Customer } from "@/module/customers/types";
import { Button } from "@/components/ui/button";
import { CheckSquare, X } from "lucide-react";

import { useState, useMemo } from "react";
import { DataTable } from "./data-table";
import { BulkActionsBar } from "./bulk-assign-bar";

const PAGE_SIZE = 8;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false);
  const [mobileSelectedIds, setMobileSelectedIds] = useState<Set<number>>(
    new Set(),
  );

  const {
    data: customersRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomersQuery();

  const customers = customersRes?.data?.customers ?? [];

  const filteredCustomers = useMemo(() => {
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleMobileSelect = (id: number) => {
    setMobileSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mobileSelectedCustomers = paginatedCustomers.filter((c) =>
    mobileSelectedIds.has(c.id),
  );

  const clearMobileSelection = () => {
    setMobileSelectedIds(new Set());
    setMobileSelectionMode(false);
  };

  return (
    <>
      <DataTable
        data={paginatedCustomers}
        columns={columns}
        total={filteredCustomers.length}
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل البيانات"
        }
        onRetry={() => refetch()}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
        enableRowSelection
        getRowId={(c: Customer) => String(c.id)}
        renderBulkActions={({ selectedRows, clearSelection }) => (
          <BulkActionsBar
            selectedCustomers={selectedRows}
            clearSelection={clearSelection}
          />
        )}
        renderMobileHeader={() =>
          !mobileSelectionMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileSelectionMode(true)}
              className="self-start gap-1.5"
            >
              <CheckSquare className="size-4" />
              تحديد
            </Button>
          ) : (
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
          )
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
      />

      <FloatingBulkBar
        selectedCustomers={mobileSelectedCustomers}
        clearSelection={clearMobileSelection}
      />
    </>
  );
}
