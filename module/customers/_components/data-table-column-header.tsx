"use client";
import * as React from "react";

import { Column } from "@tanstack/react-table";
import { ChevronDown, Info, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandInput,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  description?: string;
  type?: "default" | "filter" | "text";
  options?: {
    label: string;
    value: string;
  }[];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  description,
  type = "default",
  options,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);
  const [localTextFilter, setLocalTextFilter] = React.useState("");

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const textFilterValue = column?.getFilterValue() as string;
  const isFiltered = selectedValues.size > 0 || (typeof textFilterValue === "string" && textFilterValue.length > 0);

  if (type === "text") {
    React.useEffect(() => {
      setLocalTextFilter(textFilterValue ?? "");
    }, [textFilterValue]);

    const handleApply = () => {
      column?.setFilterValue(localTextFilter || undefined);
      setOpen(false);
    };

    const handleClear = () => {
      setLocalTextFilter("");
      column?.setFilterValue(undefined);
      setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleApply();
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 hover:bg-primary/4/50 data-[state=open]:bg-primary/4/50",
              isFiltered && "text-primary font-medium",
            )}
          >
            <span>{title}</span>
            {isFiltered && (
              <span className="ms-1 rounded-full bg-primary/4/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {textFilterValue?.length}
              </span>
            )}
            <ChevronDown className="size-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-[280px]" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                placeholder="ابحث..."
                value={localTextFilter}
                onChange={(e) => setLocalTextFilter(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              {localTextFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocalTextFilter("")}
                  className="size-7"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={handleClear}>
                مسح
              </Button>
              <Button variant="default" size="sm" onClick={handleApply}>
                تطبيق
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (type === "filter") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 hover:bg-primary/4/50 data-[state=open]:bg-primary/4/50",
              isFiltered && "text-primary font-medium",
            )}
          >
            <span>{title}</span>
            {isFiltered && (
              <span className="ms-1 rounded-full bg-primary/4/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {selectedValues.size}
              </span>
            )}
            <ChevronDown className="size-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[220px]" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>لا توجد خيارات</CommandEmpty>
              <CommandGroup>
                {options?.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          selectedValues.delete(option.value);
                        } else {
                          selectedValues.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues);
                        column?.setFilterValue(
                          filterValues.length ? filterValues : undefined,
                        );
                      }}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="data-[state=checked]:bg-brand-700 data-[state=checked]:border-brand-primary"
                      />
                      <span className="flex-1">{option.label}</span>
                      {facets?.get(option.value) && (
                        <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/4 px-1.5 font-mono text-xs">
                          {facets.get(option.value)}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        column?.setFilterValue(undefined);
                        setOpen(false);
                      }}
                      className="justify-center text-center text-sm text-muted-foreground hover:text-text-primary"
                    >
                      مسح الفلتر
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-gray-500 font-medium text-sm">{title}</span>
      {description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="cursor-pointer size-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
