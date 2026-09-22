"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/tredro/empty-state";
import { AlertCircle, Plus, RefreshCw, Search, SearchX } from "lucide-react";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProductsQuery } from "../hook";
import { DataTableRowActions } from "./data-table-row-actions";
import { ProductStatusDropdown } from "./product-status-dropdown";
import { ImageWithFallback } from "@/components/tredro/image-with-fallback";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Product } from "../types";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function ProductsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductsQuery();

  const productList = useMemo(
    () => products?.data?.products ?? [],
    [products],
  );

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

  const hasActiveSearch = search.trim().length > 0;

  // Opens the product details view — adjust to match your routing
  const handleOpenProduct = (product: Product) => {
    router.push(`/products/detail?id=${product.id}`);
  };

  return (
    <div className="rounded-md border border-border">
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between border-b px-6 py-6 border-border">
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <span>المنتجات</span>
            <Badge>{filtered.length} منتج</Badge>
          </h1>
        </div>

        <div className="flex items-center justify-between py-4 px-6 gap-3 border-b border-border">
          <div className="relative w-[280px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <PermissionGate module="products" requireAction fallback={null}>
            <Button size="sm" onClick={() => router.push("/products/create")}>
              <Plus className="size-4" />
              إضافة منتج
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="py-4">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-gray-500">
              {error instanceof Error
                ? error.message
                : "حدث خطأ أثناء تحميل البيانات"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
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
        ) : filtered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 auto-rows-fr gap-x-4 gap-y-4 px-2">
            {filtered.map((product) => (
              <Card
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className="relative w-full self-stretch flex flex-col pt-0 cursor-pointer transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                  <ImageWithFallback
                    images={
                      product.primary_image ? [product.primary_image] : []
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
                </div>

                <CardHeader className="flex-1 min-w-0">
                  <CardTitle className="flex min-w-0 items-center justify-between gap-2">
                    <Tooltip>
                      <TooltipTrigger
                        className="min-w-0 flex-1 text-start"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="block truncate">{product.name}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{product.name}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PermissionGate
                        module="products"
                        requireAction
                        fallback={
                          <Badge
                            variant={
                              product.status === "published"
                                ? "success"
                                : "warning"
                            }
                          >
                            {product.status === "published"
                              ? "منشور"
                              : "مسودة"}
                          </Badge>
                        }
                      >
                        <ProductStatusDropdown product={product} />
                      </PermissionGate>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardFooter className="mt-auto justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.brand && (
                        <Badge variant="outline">{product.brand}</Badge>
                      )}
                      <Badge variant="outline">{product.unit_name}</Badge>
                      {product.default_price != null && (
                        <Badge variant="outline">
                          {product.default_price.price}{" "}
                          {product.default_price.currency_symbol}{" "}
                          {product.default_price.currency_code}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DataTableRowActions row={{ original: product }} />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !productList.length ? (
          <EmptyState variant="products" size="sm" />
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
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 text-sm font-medium text-primary hover:underline"
            >
              مسح البحث
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
