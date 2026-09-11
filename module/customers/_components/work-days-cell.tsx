"use client";
import * as React from "react";
import { Edit2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Customer, WorkDay } from "../types";
import { WORK_DAYS, WorkDayPicker, getWorkDayLabel } from "./work-day-picker";
import { useAssignRepsMutation } from "../hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { cn } from "@/lib/utils";

interface WorkDaysCellProps {
  customer: Customer;
}

export function WorkDaysCell({ customer }: WorkDaysCellProps) {
  const rep = (customer.assigned_reps_details ?? [])[0];
  const { data: repsRes } = useRepsQuery();
  const { mutate: assignReps, isPending } = useAssignRepsMutation();

  const repDefaultDays = React.useMemo(
    () =>
      ((repsRes?.data?.reps ?? []).find((r) => r.id === rep?.id)?.work_days as
        | WorkDay[]
        | undefined) ?? [],
    [repsRes, rep?.id],
  );

  const explicitDays = (rep?.work_days as WorkDay[] | undefined) ?? [];
  const isUsingDefault = explicitDays.length === 0;
  // Show the default value pre-filled when the customer has no explicit
  // override yet — the editor should reflect what's actually in effect.
  const effectiveDays = isUsingDefault ? repDefaultDays : explicitDays;

  const [draftDays, setDraftDays] = React.useState<WorkDay[]>(effectiveDays);
  React.useEffect(() => setDraftDays(effectiveDays), [effectiveDays]);

  if (!rep) {
    return (
      <span className="text-sm font-normal text-muted-foreground">
        بدون مندوب
      </span>
    );
  }

  const handleChange = (days: WorkDay[]) => {
    setDraftDays(days);
    assignReps({
      id: customer.id,
      assignments: [
        { rep_id: rep.id, work_days: days.length > 0 ? days : undefined },
      ],
      visitDaysOnly: true,
    });
  };

  return (
    <Popover>
      <PopoverTrigger>
        <button
          type="button"
          disabled={isPending}
          title="تعديل أيام الزيارة"
          className="inline-flex flex-wrap items-center gap-1 text-right rounded-md px-1 py-0.5 hover:bg-accent disabled:opacity-60"
        >
          {effectiveDays.length > 0 ? (
            effectiveDays.map((day) => (
              <Badge
                key={day}
                variant="secondary"
                className="text-xs px-1.5 py-0 h-auto font-normal"
              >
                {getWorkDayLabel(day)}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
              -
            </Badge>
          )}
          <Edit2 className="size-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="left" align="center">
        <div className="text-right space-y-2 min-w-[200px]">
          <p className="text-sm font-medium">أيام زيارة {rep.name}</p>
          <WorkDayPicker
            value={draftDays}
            onChange={handleChange}
            variant="compact"
          />
          <p className="text-xs text-muted-foreground">
            اترك بدون تحديد لاستخدام أيام العمل الافتراضية للمندوب
          </p>
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
