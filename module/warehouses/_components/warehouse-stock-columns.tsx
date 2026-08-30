"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { ImageWithFallback } from "@/components/tredro/image-with-fallback";
import { SortableColumnHeader } from "./sortable-column-header";
import type { WarehouseProductStockRow } from "../types";

function formatQuantity(value: string) {
  return Number(value).toLocaleString("ar", { maximumFractionDigits: 3 });
}

/** Product's own avatar + name in the stock table — links to its detail page without triggering row click. */
function ProductCell({ row }: { row: WarehouseProductStockRow }) {
  return (
    <Link
      href={`/products/detail?id=${row.product}`}
      onClick={(e) => e.stopPropagation()}
      className="group flex min-w-0 items-center gap-3"
    >
      <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-border">
        <ImageWithFallback
          images={
            row.product_image
              ? [{ id: row.product, image: row.product_image, alt_text: row.product_name }]
              : []
          }
          alt={row.product_name}
          iconSize={18}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground underline-offset-2 group-hover:text-primary group-hover:underline">
          {row.product_name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {[row.product_sku, row.product_barcode].filter(Boolean).join(" · ") || "—"}
        </span>
      </div>
    </Link>
  );
}

function LowStockBadge({ row }: { row: WarehouseProductStockRow }) {
  if (row.is_low_stock === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (row.is_low_stock) {
    return (
      <Badge variant="destructive" className="gap-1">
        <IconRenderer name="warning_outlined" className="size-3" />
        منخفض
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1">
      <IconRenderer name="tick_outlined" className="size-3" />
      كافٍ
    </Badge>
  );
}

export function createWarehouseStockColumns(): ColumnDef<WarehouseProductStockRow>[] {
  return [
    {
      id: "product",
      accessorKey: "product_name",
      header: "الصنف",
      cell: ({ row }) => <ProductCell row={row.original} />,
    },
    {
      accessorKey: "unit_name",
      header: "الوحدة",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.unit_name}</span>
      ),
    },
    {
      id: "quantity",
      accessorFn: (row) => Number(row.quantity),
      header: ({ column }) => (
        <SortableColumnHeader column={column} title="الكمية المتوفرة" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatQuantity(row.original.quantity)}
        </span>
      ),
    },
    {
      id: "reorder_point",
      accessorFn: (row) => (row.reorder_point ? Number(row.reorder_point) : null),
      header: ({ column }) => (
        <SortableColumnHeader column={column} title="حد إعادة الطلب" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.reorder_point ? formatQuantity(row.original.reorder_point) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "حالة المخزون",
      cell: ({ row }) => <LowStockBadge row={row.original} />,
    },
  ];
}

export { ProductCell as WarehouseStockProductCell, LowStockBadge as WarehouseLowStockBadge };
