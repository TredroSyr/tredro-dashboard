"use client";
import * as React from "react";
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface InlineOption {
  value: string;
  label: string;
}

interface InlineSelectPopoverProps {
  trigger: React.ReactNode;
  options: InlineOption[];
  value?: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreate?: boolean;
  createLabel?: (query: string) => string;
  align?: "start" | "center" | "end";
}

export function InlineSelectPopover({
  trigger,
  options,
  value,
  onSelect,
  loading,
  searchPlaceholder = "ابحث...",
  emptyText = "لا توجد نتائج",
  allowCreate = false,
  createLabel = (q) => `إضافة "${q}"`,
  align = "start",
}: InlineSelectPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === query.trim().toLowerCase(),
  );

  const handleSelect = (v: string) => {
    onSelect(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent
        className="p-0 w-[min(280px,calc(100vw-2rem))]"
        align={align}
      >
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                جارِ التحميل...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filtered.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "me-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {allowCreate && query.trim() && !exactMatch && (
                  <CommandGroup>
                    <CommandItem onSelect={() => handleSelect(query.trim())}>
                      {createLabel(query.trim())}
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
