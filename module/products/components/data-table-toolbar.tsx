"use client";
import { Plus, Search } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/tredro/PermissionGate";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  total?: number;
  search: string;
  onSearchChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  total,
  search,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-6 border-border">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span>المنتجات</span>
          {total !== undefined && <Badge>{total} منتج</Badge>}
        </h1>
      </div>

      <div className="flex items-center justify-between py-4 px-6 gap-3 border-b border-border">
        <div className="relative w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
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
    </>
  );
}
