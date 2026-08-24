"use client";
import * as React from "react";
import { Check } from "lucide-react";

import { WorkDay } from "../types";
import { cn } from "@/lib/utils";

export const WORK_DAYS: { value: WorkDay; label: string; short: string }[] = [
  { value: "sunday", label: "الأحد", short: "أحد" },
  { value: "monday", label: "الإثنين", short: "إثن" },
  { value: "tuesday", label: "الثلاثاء", short: "ثلا" },
  { value: "wednesday", label: "الأربعاء", short: "أرب" },
  { value: "thursday", label: "الخميس", short: "خمي" },
  { value: "friday", label: "الجمعة", short: "جمع" },
  { value: "saturday", label: "السبت", short: "سبت" },
];

export function getWorkDayLabel(day: WorkDay): string {
  return WORK_DAYS.find((d) => d.value === day)?.label || day;
}

export function getWorkDayShortLabel(day: WorkDay): string {
  return WORK_DAYS.find((d) => d.value === day)?.label || day;
}

interface WorkDayPickerProps {
  value?: WorkDay[];
  onChange?: (days: WorkDay[]) => void;
  variant?: "full" | "short" | "compact";
  className?: string;
  disabled?: boolean;
}

export function WorkDayPicker({
  value = [],
  onChange,
  variant = "full",
  className,
  disabled = false,
}: WorkDayPickerProps) {
  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const handleToggle = (day: WorkDay) => {
    if (disabled) return;
    const newDays = selectedSet.has(day)
      ? value.filter((d) => d !== day)
      : [...value, day];
    onChange?.(newDays);
  };

  const isShort = variant === "short" || variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        variant === "compact" && "gap-1",
        className,
      )}
    >
      {WORK_DAYS.map((day) => {
        const isSelected = selectedSet.has(day.value);
        const label = isShort ? day.short : day.label;

        return (
          <button
            key={day.value}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(day.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors",
              variant === "compact"
                ? "h-7 px-2 text-xs"
                : "h-9 px-3",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {isSelected && variant !== "compact" && (
              <Check className="size-3.5 me-1" />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}

interface WorkDayBadgeProps {
  days?: WorkDay[];
  className?: string;
  variant?: "short" | "full";
}

export function WorkDayBadge({
  days = [],
  className,
  variant = "short",
}: WorkDayBadgeProps) {
  if (days.length === 0) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        افتراضي
      </span>
    );
  }

  const labels = days.map(
    (d) => variant === "short" ? getWorkDayShortLabel(d) : getWorkDayLabel(d),
  );

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {labels.join("، ")}
    </span>
  );
}

interface WorkDaysTagProps {
  days?: WorkDay[];
  className?: string;
}

export function WorkDaysTag({ days = [], className }: WorkDaysTagProps) {
  if (days.length === 0) {
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground",
        className,
      )}>
        افتراضي
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {days.map((day) => (
        <span
          key={day}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
        >
          {getWorkDayShortLabel(day)}
        </span>
      ))}
    </div>
  );
}
