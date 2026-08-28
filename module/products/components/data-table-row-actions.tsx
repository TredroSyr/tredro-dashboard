"use client";
import { useRouter } from "next/navigation";

import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Product } from "../types";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import { ProductStatusToggle } from "./product-status-toggle";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as Product;
  const router = useRouter();

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/products/detail?id=${item.id}`)}
      >
        <IconRenderer name="eye_visible_outlined" className="size-4" />
      </Button>

      <PermissionGate module="products" requireAction fallback={null}>
        <ProductStatusToggle product={item}>
          {({ onToggle }) =>
            item.is_active ? (
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <IconRenderer
                  name="bin_outlined"
                  className="size-4 text-destructive"
                />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <IconRenderer
                  name="refresh_outlined"
                  className="size-4 text-primary"
                />
              </Button>
            )
          }
        </ProductStatusToggle>
      </PermissionGate>
    </div>
  );
}
