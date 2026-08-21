// components/tredro/date-range-filter.tsx
"use client";
import * as React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DateRangeFilter({
  value,
  onChange,
  className,
  align = "end",
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setRange(value);
  }, [value]);

  const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected);
    onChange?.(selected);
  };

  const label = React.useMemo(() => {
    if (!range?.from) return "تحديد الفترة";
    if (!range.to) return format(range.from, "d MMM yyyy", { locale: ar });
    return `${format(range.from, "d MMM", { locale: ar })} - ${format(
      range.to,
      "d MMM yyyy",
      { locale: ar },
    )}`;
  }, [range]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", className)}
        >
          <IconRenderer name="calendar_outlined" className="size-4" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          defaultMonth={range?.from}
          dir="rtl"
        />
        <div className="flex items-center justify-between border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleSelect(undefined);
            }}
          >
            مسح
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            تطبيق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
