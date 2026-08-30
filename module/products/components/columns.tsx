"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/module/reps/_components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Product } from "../types";

const val = (v?: string | null) => (v && v.trim() ? v : "-");

export const columns: ColumnDef<Product>[] = [
  {
    id: "index",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row }) => <Badge variant="outline">{row.index + 1}</Badge>,
  },
  {
    id: "image",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الصورة" />
    ),
    cell: ({ row }) => {
      const img = row.original.primary_image;
      return img ? (
        <div className="size-10 rounded-md overflow-hidden border border-border relative">
          <Image
            src={img.image}
            alt={img.alt_text ?? ""}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="size-10 rounded-md border border-dashed border-border" />
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم المنتج" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {val(row.original.name)}
      </span>
    ),
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium" dir="ltr">
        {val(row.original.sku)}
      </span>
    ),
  },
  {
    accessorKey: "category_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التصنيف" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{val(row.original.category_name)}</span>
    ),
  },
  {
    id: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="السعر" />
    ),
    cell: ({ row }) => {
      const p = row.original.default_price;
      return p ? (
        <span className="text-sm font-medium" dir="ltr">
          {p.currency_symbol}
          {p.price}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {p.currency_code}
          </span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "destructive"}>
        {row.original.is_active ? "مفعّل" : "موقوف"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
