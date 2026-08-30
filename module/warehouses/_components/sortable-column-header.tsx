"use client";

import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

/** Click-to-sort table header — cycles ascending → descending → none. */
export function SortableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "-mx-2 flex h-auto items-center gap-1 px-2 py-1 font-medium",
        sorted && "text-primary",
        className,
      )}
    >
      <span>{title}</span>
      <IconRenderer
        name={
          sorted === "asc"
            ? "sort_up_outlined"
            : sorted === "desc"
              ? "sort_down_outlined"
              : "sort_outlined"
        }
        className={cn("size-3.5", !sorted && "text-muted-foreground")}
      />
    </Button>
  );
}
