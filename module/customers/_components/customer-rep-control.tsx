"use client";
import * as React from "react";
import { Plus, X, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PhoneInput } from "@/components/tredro/phone-input";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { InlineSelectPopover } from "./inline-select-popover";
import { WorkDayPicker } from "./work-day-picker";
import { Customer, WorkDay } from "../types";
import { useAssignRepsMutation, useRemoveRepsMutation } from "../hooks";
import { useRepsQuery } from "@/module/reps/hooks";

interface CustomerRepControlProps {
  customer: Customer;
}

// Compact header control replacing the old "reps" tab: shows the customer's
// rep (a customer can only have one, see assign-rep-cell.tsx) and opens a
// popover with assign / remove / edit-work-days actions on click.
export function CustomerRepControl({ customer }: CustomerRepControlProps) {
  const rep = (customer.assigned_reps_details ?? [])[0];

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { mutate: assignReps, isPending: isAssigning } =
    useAssignRepsMutation();
  const { mutate: removeReps, isPending: isRemoving } =
    useRemoveRepsMutation();

  const options = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? [])
        .filter((r) => r.id !== rep?.id)
        .map((r) => ({ value: String(r.id), label: r.name })),
    [repsRes, rep?.id],
  );

  const repDefaultDays = React.useMemo(
    () =>
      ((repsRes?.data?.reps ?? []).find((r) => r.id === rep?.id)
        ?.work_days as WorkDay[] | undefined) ?? [],
    [repsRes, rep?.id],
  );
  const explicitDays = (rep?.work_days as WorkDay[] | undefined) ?? [];
  const isUsingDefault = explicitDays.length === 0;
  // Show the default value pre-filled when the customer has no explicit
  // override yet — the editor should reflect what's actually in effect.
  const effectiveDays = isUsingDefault ? repDefaultDays : explicitDays;

  const [draftDays, setDraftDays] = React.useState<WorkDay[]>(effectiveDays);
  React.useEffect(() => setDraftDays(effectiveDays), [effectiveDays]);

  const handleAssign = (repId: string) => {
    assignReps({ id: customer.id, rep_ids: [Number(repId)] });
  };

  const handleRemove = () => {
    if (!rep) return;
    removeReps({ id: customer.id, rep_ids: [rep.id] });
  };

  const handleWorkDaysChange = (days: WorkDay[]) => {
    if (!rep) return;
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
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 max-w-[200px]"
        >
          <Users className="size-4 shrink-0" />
          <span className="truncate">{rep ? rep.name : "بدون مندوب"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3 text-right">
          <p className="text-sm font-medium">المندوب المسؤول</p>

          {rep ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {rep.name.trim().charAt(0)}
                  </span>
                  <EntityLink
                    href={`/reps/detail?id=${rep.id}`}
                    className="truncate text-sm font-medium"
                  >
                    {rep.name}
                  </EntityLink>
                </div>
                <button
                  type="button"
                  title="إزالة المندوب"
                  disabled={isRemoving}
                  onClick={handleRemove}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>

              <PhoneInput value={rep.phone} readOnly />

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">أيام الزيارة</p>
                <WorkDayPicker
                  value={draftDays}
                  onChange={handleWorkDaysChange}
                  variant="compact"
                />
                <p className="text-xs text-muted-foreground">
                  اترك بدون تحديد لاستخدام أيام العمل الافتراضية للمندوب
                </p>
              </div>
            </>
          ) : (
            <InlineSelectPopover
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAssigning}
                  className="w-full gap-1.5"
                >
                  <Plus className="size-3.5" />
                  إضافة مندوب
                </Button>
              }
              options={options}
              onSelect={handleAssign}
              loading={isLoadingReps}
              searchPlaceholder="ابحث عن مندوب..."
              emptyText={options.length ? "لا توجد نتائج" : "لا يوجد مندوبون"}
              align="end"
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
