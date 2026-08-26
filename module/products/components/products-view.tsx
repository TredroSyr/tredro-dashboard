"use client";

import { Badge } from "@/components/ui/badge";

import { useState, useMemo } from "react";
import { useProductsQuery } from "../hook";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { DataTableRowActions } from "./data-table-row-actions";

const PAGE_SIZE = 8;

export default function ProductsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductsQuery();

  const productList = products?.data?.products ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return productList;
    const q = search.toLowerCase();
    return productList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q),
    );
  }, [productList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <DataTable
      data={paginated}
      columns={columns}
      total={filtered.length}
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
      renderCard={(product) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {product.name}
            </span>
            <Badge variant={product.is_active ? "default" : "destructive"}>
              {product.is_active ? "مفعّل" : "موقوف"}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground" dir="ltr">
            {product.sku ?? "-"}
          </span>
          {product.default_price && (
            <span className="text-sm font-medium">
              {product.default_price.currency_symbol}
              {product.default_price.price}
            </span>
          )}
          <div className="flex justify-end pt-2 border-t border-border">
            <DataTableRowActions row={{ original: product } as any} />
          </div>
        </div>
      )}
    />
  );
}
