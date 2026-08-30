"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconRenderer } from "@/assets/icons/iconRenderer";

interface WarehousesDataTableToolbarProps {
  title: string;
  totalLabel?: string;
  total?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra controls rendered next to the search box — status filters, an "add" button, etc. */
  actions?: React.ReactNode;
}

export function WarehousesDataTableToolbar({
  title,
  totalLabel,
  total,
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  actions,
}: WarehousesDataTableToolbarProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span>{title}</span>
          {total !== undefined && (
            <Badge className="font-normal">
              {total} {totalLabel}
            </Badge>
          )}
        </h2>
      </div>

      {(onSearchChange || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          {onSearchChange && (
            <div className="relative w-full xs:w-[220px] sm:w-[280px]">
              <IconRenderer
                name="search_outlined"
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-9"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
    </>
  );
}
