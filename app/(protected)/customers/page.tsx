"use client";

import { PhoneInput } from "@/components/tredro/phone-input";
import { Badge } from "@/components/ui/badge";
import { columns } from "@/module/customers/_components/columns";
import { DataTable } from "@/module/customers/_components/data-table";

import { DataTableRowActions } from "@/module/customers/_components/data-table-row-actions";
import { useCustomersQuery } from "@/module/customers/hooks";

import { useState, useMemo } from "react";

const PAGE_SIZE = 8;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
        (c.assigned_rep_name ?? "").toLowerCase().includes(q),
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

  return (
    <DataTable
      data={paginatedCustomers}
      columns={columns}
      total={filteredCustomers.length}
      search={search}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        error instanceof Error ? error.message : "حدث خطأ أثناء تحميل البيانات"
      }
      onRetry={() => refetch()}
      pagination={{ page, totalPages }}
      onPageChange={setPage}
      renderCard={(customer) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {customer.name}
            </span>
            <Badge variant={customer.is_active ? "default" : "destructive"}>
              {customer.is_active ? "مفعّل" : "موقوف"}
            </Badge>
          </div>

          <PhoneInput value={customer.phone} readOnly />
          <span className="text-sm text-muted-foreground" dir="ltr">
            {customer.email ?? "-"}
          </span>
          <span className="text-sm text-muted-foreground">
            {customer.assigned_rep_name ?? "بدون مندوب"}
          </span>
          <div className="flex justify-end pt-2 border-t border-border">
            <DataTableRowActions row={{ original: customer }} />
          </div>
        </div>
      )}
    />
  );
}
