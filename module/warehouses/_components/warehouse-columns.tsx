"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { PermissionGate } from "@/components/tredro/PermissionGate";
import type { Warehouse } from "../types";

export function createWarehouseColumns({
  onEdit,
  onViewStock,
  onDeactivate,
}: {
  onEdit: (warehouse: Warehouse) => void;
  onViewStock: (warehouse: Warehouse) => void;
  onDeactivate: (warehouse: Warehouse) => void;
}): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "name",
      header: "اسم المستودع",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "kind",
      header: "التصنيف",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.kind || "—"}</span>
      ),
    },
    {
      accessorKey: "address",
      header: "العنوان",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address || "—"}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "destructive"}>
          {row.original.is_active ? "نشط" : "موقوف"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const warehouse = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="عرض المخزون"
              onClick={(e) => {
                e.stopPropagation();
                onViewStock(warehouse);
              }}
            >
              <IconRenderer name="bundle_outlined" className="size-4" />
            </Button>
            <PermissionGate module="invoices" requireAction fallback={null}>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="إجراءات المستودع"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconRenderer name="more_outlined" className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(warehouse);
                    }}
                  >
                    <IconRenderer name="edit_outlined" className="size-4" />
                    تعديل
                  </DropdownMenuItem>
                  {warehouse.is_active && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeactivate(warehouse);
                      }}
                    >
                      <IconRenderer name="block_outlined" className="size-4" />
                      إيقاف المستودع
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGate>
          </div>
        );
      },
    },
  ];
}
