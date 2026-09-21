"use client";
import * as React from "react";
import { ar } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar, ARABIC_MONTH_NAMES } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

function formatArabicDate(date: Date, withYear = true) {
  const day = date.getDate();
  const month = ARABIC_MONTH_NAMES[date.getMonth()];
  return withYear ? `${day} ${month} ${date.getFullYear()}` : `${day} ${month}`;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}

interface FilterTriggerProps {
  label: string;
  hasValue: boolean;
  onClear: () => void;
  className?: string;
}

function FilterTrigger({
  label,
  hasValue,
  onClear,
  className,
}: FilterTriggerProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex w-full items-center gap-2 overflow-hidden",
              hasValue && "pe-8"
            )}
          />
        }
      >
        <IconRenderer name="calendar_outlined" className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      {hasValue && (
        <button
          type="button"
          aria-label="مسح"
          onClick={onClear}
          className="absolute end-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconRenderer name="close_outlined" className="size-3.5" />
        </button>
      )}
    </div>
  );
}

interface DateFilterBaseProps {
  className?: string;
  align?: "start" | "center" | "end";
}

interface DateRangeFilterProps extends DateFilterBaseProps {
  mode?: "range";
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
}

interface DateSingleFilterProps extends DateFilterBaseProps {
  mode: "single";
  value?: Date;
  onChange?: (value: Date | undefined) => void;
}

type DateFilterProps = DateRangeFilterProps | DateSingleFilterProps;

export function DateFilter(props: DateFilterProps) {
  const { className, align = "end" } = props;
  const [open, setOpen] = React.useState(false);

  if (props.mode === "single") {
    return (
      <SingleDateFilter
        value={props.value}
        onChange={props.onChange}
        className={className}
        align={align}
        open={open}
        setOpen={setOpen}
      />
    );
  }

  return (
    <RangeDateFilter
      value={props.value}
      onChange={props.onChange}
      className={className}
      align={align}
      open={open}
      setOpen={setOpen}
    />
  );
}

interface SingleDateFilterInnerProps {
  value?: Date;
  onChange?: (value: Date | undefined) => void;
  className?: string;
  align: "start" | "center" | "end";
  open: boolean;
  setOpen: (open: boolean) => void;
}

function SingleDateFilter({
  value,
  onChange,
  className,
  align,
  open,
  setOpen,
}: SingleDateFilterInnerProps) {
  const isMobile = useIsMobile(768);
  const [selected, setSelected] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    setSelected(date);
    onChange?.(date);
    setOpen(false);
  };

  const label = selected ? formatArabicDate(selected) : "تحديد التاريخ";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterTrigger
        label={label}
        hasValue={!!selected}
        onClear={() => handleSelect(undefined)}
        className={className}
      />
      <PopoverContent
        className="w-[calc(100vw-1.5rem)] max-w-[20rem] overflow-hidden rounded-xl p-0 shadow-lg md:w-auto md:max-w-none"
        align={isMobile ? "center" : align}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          captionLayout="label"
          dir="rtl"
          locale={ar}
        />
        <div className="flex items-center justify-between border-t border-border p-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(undefined)}
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

interface RangeDateFilterInnerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
  className?: string;
  align: "start" | "center" | "end";
  open: boolean;
  setOpen: (open: boolean) => void;
}

function RangeDateFilter({
  value,
  onChange,
  className,
  align,
  open,
  setOpen,
}: RangeDateFilterInnerProps) {
  const isMobile = useIsMobile(768);
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
    if (!range.to) return formatArabicDate(range.from);
    return `${formatArabicDate(range.from, false)} - ${formatArabicDate(
      range.to
    )}`;
  }, [range]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterTrigger
        label={label}
        hasValue={!!range?.from}
        onClear={() => handleSelect(undefined)}
        className={className}
      />
      <PopoverContent
        className="w-[calc(100vw-1.5rem)] max-w-[24rem] overflow-hidden rounded-xl p-0 shadow-lg md:w-auto md:max-w-none"
        align={isMobile ? "center" : align}
      >
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={isMobile ? 1 : 2}
          defaultMonth={range?.from}
          captionLayout="label"
          dir="rtl"
          locale={ar}
        />
        <div className="flex items-center justify-between border-t border-border p-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(undefined)}
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
