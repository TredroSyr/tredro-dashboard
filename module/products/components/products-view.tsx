"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProductsQuery } from "../hook";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { DataTableRowActions } from "./data-table-row-actions";
import { ImageWithFallback } from "@/components/tredro/image-with-fallback";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Barcode, Hash } from "lucide-react";
import { Product } from "../types";

const PAGE_SIZE = 8;

export default function ProductsView() {
  const router = useRouter();
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

  // Opens the product details view — adjust to match your routing
  const handleOpenProduct = (product: Product) => {
    router.push(`/products/detail?id=${product.id}`);
  };

  return (
    <DataTable
      data={filtered}
      columns={columns}
      total={filtered.length}
      hasAnyData={productList.length > 0}
      emptyStateVariant="products"
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        error instanceof Error ? error.message : "حدث خطأ أثناء تحميل البيانات"
      }
      onRetry={() => refetch()}
      renderCard={(product) => (
        <Card
          key={product.id}
          onClick={() => handleOpenProduct(product)}
          className="relative mx-auto w-full max-w-sm pt-0 cursor-pointer transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            <ImageWithFallback
              images={
                product.images ??
                (product.primary_image ? [product.primary_image] : [])
              }
              alt={product.name}
              iconSize={32}
            />

            {/* Category badge - top corner of image */}
            {product.category_name && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm"
              >
                {product.category_name}
              </Badge>
            )}

            {/* Active/Inactive badge - opposite corner */}
            <Badge
              variant={product.is_active ? "default" : "secondary"}
              className="absolute top-2 right-2"
            >
              {product.is_active ? "منشور" : "غير منشور"}
            </Badge>
          </div>

          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <p className="line-clamp-2 text-start">
                    {product.description || "لا يوجد وصف"}
                  </p>
                </TooltipTrigger>
                {product.description && (
                  <TooltipContent className="max-w-xs">
                    <p>{product.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </CardDescription>
          </CardHeader>

          <CardFooter className="justify-between gap-2">
            <div>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.brand && (
                  <Badge variant="outline">{product.brand}</Badge>
                )}
                <Badge variant="outline">{product.unit_name}</Badge>
                {product.default_price != null && (
                  <Badge variant="outline">
                    {product.default_price.price}{" "}
                    {product.default_price.currency_symbol}
                  </Badge>
                )}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <DataTableRowActions row={{ original: product }} />
            </div>
          </CardFooter>
        </Card>
      )}
    />
  );
}
