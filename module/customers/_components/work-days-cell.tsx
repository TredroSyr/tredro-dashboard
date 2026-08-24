"use client";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer, WorkDay } from "../types";
import { WORK_DAYS, getWorkDayLabel, getWorkDayShortLabel } from "./work-day-picker";
import { cn } from "@/lib/utils";

interface WorkDaysCellProps {
  customer: Customer;
}

export function WorkDaysCell({ customer }: WorkDaysCellProps) {
  const assignedReps = customer.assigned_reps_details ?? [];

  if (assignedReps.length === 0) {
    return (
      <span className="text-sm font-normal text-muted-foreground">
        بدون مندوب
      </span>
    );
  }

  // Collect all unique work days across all assigned reps
  const allWorkDays = new Set<WorkDay>();
  const repsWithWorkDays: { name: string; work_days?: WorkDay[] }[] = [];
  let hasDefaultDays = false;

  for (const rep of assignedReps) {
    repsWithWorkDays.push({
      name: rep.name,
      work_days: rep.work_days,
    });
    if (rep.work_days && rep.work_days.length > 0) {
      for (const day of rep.work_days) {
        allWorkDays.add(day);
      }
    } else {
        hasDefaultDays = true;
      }
  }

  // If no explicit work days at all (all using default)
  if (allWorkDays.size === 0) {
    return (
      <Popover>
        <PopoverTrigger>
          <button
            type="button"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80"
          >
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 font-normal"
            >
            -
            </Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="left" align="center">
          <div className="text-right space-y-2">
            <p className="text-sm font-medium mb-2">المندوبون المسؤولون:</p>
            {repsWithWorkDays.map((rep, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-muted/50">
                <span className="text-sm font-medium">{rep.name}</span>
                <span className="text-xs text-muted-foreground">
                  يستخدم أيام العمل الافتراضية للمندوب
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Mix of explicit days and default days
  if (hasDefaultDays && allWorkDays.size > 0) {
    return (
      <Popover>
        <PopoverTrigger>
          <button
            type="button"
            className="inline-flex flex-wrap items-center gap-1 text-right"
          >
            {Array.from(allWorkDays).map((day) => (
              <Badge
                key={day}
                variant="secondary"
                className="text-xs px-1.5 py-0 h-auto font-normal"
              >
                {getWorkDayShortLabel(day)}
              </Badge>
            ))}
            
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="left" align="center">
          <div className="text-right space-y-2 min-w-[200px]">
            <p className="text-sm font-medium mb-2">دورات زيارة المندوبين:</p>
            {repsWithWorkDays.map((rep, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-muted/50">
                <span className="text-sm font-medium">{rep.name}</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {rep.work_days && rep.work_days.length > 0 ? (
                    rep.work_days.map((day) => (
                      <span
                        key={day}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                      >
                        {getWorkDayLabel(day)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      أيام العمل الافتراضية
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // All have explicit work days
  return (
    <Popover>
      <PopoverTrigger>
        <button
          type="button"
          className="inline-flex flex-wrap items-center gap-1 text-right"
        >
          {Array.from(allWorkDays).map((day) => (
            <Badge
            key={day}
            variant="secondary"
            className="text-xs px-1.5 py-0 h-auto font-normal"
          >
            {getWorkDayShortLabel(day)}
          </Badge>
        ))}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="left" align="center">
        <div className="text-right space-y-2 min-w-[200px]">
          <p className="text-sm font-medium mb-2">دورات زيارة المندوبين:</p>
          {repsWithWorkDays.map((rep, idx) => (
            <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-muted/50">
              <span className="text-sm font-medium">{rep.name}</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {rep.work_days && rep.work_days.map((day) => (
                  <span
                    key={day}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                  >
                    {getWorkDayLabel(day)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface WorkDaysFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function WorkDaysFilter({ value, onChange }: WorkDaysFilterProps) {
  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const toggleDay = (day: string) => {
    if (selectedSet.has(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2">
      {WORK_DAYS.map((day) => {
        const isSelected = selectedSet.has(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md border text-xs font-medium transition-colors h-7 px-2",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}
