"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyText = "لا توجد نتائج",
  disabled,
  loading,
  className,
  onCreateNew,
  createNewLabel = "إضافة جديد",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const handleCreateNew = () => {
    setOpen(false);
    onCreateNew?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "h-12 rounded-xl w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? "جارِ التحميل..."
              : selected
              ? selected.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={triggerWidth ? { width: triggerWidth } : undefined}
        align="start"
      >
        <Command>
          <div className="relative">
            <CommandInput
              placeholder={searchPlaceholder}
              className={onCreateNew ? "pe-10" : undefined}
            />
            {onCreateNew && (
              <button
                type="button"
                onClick={handleCreateNew}
                title={createNewLabel}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent z-10"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>
              {onCreateNew ? (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary"
                >
                  <Plus className="h-4 w-4" />
                  {createNewLabel}
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
