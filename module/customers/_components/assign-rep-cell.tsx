"use client";
import * as React from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineSelectPopover } from "./inline-select-popover";
import { Customer } from "../types";
import { useAssignRepsMutation, useRemoveRepsMutation } from "../hooks";
import { useRepsQuery } from "@/module/reps/hooks";

export function AssignRepCell({ customer }: { customer: Customer }) {
  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { mutate: assignReps, isPending: isAssigning } =
    useAssignRepsMutation();
  const { mutate: removeReps, isPending: isRemoving } = useRemoveRepsMutation();

  const assignedReps = customer.assigned_reps_details ?? [];
  const assignedIds = new Set(assignedReps.map((r) => String(r.id)));

  const options = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? [])
        .filter((r) => !assignedIds.has(String(r.id)))
        .map((r) => ({ value: String(r.id), label: r.name })),
    [repsRes, assignedIds],
  );

  const handlePick = (repId: string) => {
    assignReps({ id: customer.id, rep_ids: [Number(repId)] });
  };

  const handleRemove = (repId: number) => {
    removeReps({ id: customer.id, rep_ids: [repId] });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
      {assignedReps.length === 0 && (
        <span className="text-sm text-muted-foreground">بدون مندوب</span>
      )}
      {assignedReps.map((rep) => (
        <Badge key={rep.id} variant="secondary" className="gap-1 pr-1">
          {rep.name}
          <button
            type="button"
            disabled={isRemoving}
            onClick={() => handleRemove(rep.id)}
            className="rounded-full hover:bg-muted-foreground/20 disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      <InlineSelectPopover
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isAssigning}
            className="size-6 rounded-full border border-dashed border-border shrink-0"
          >
            <Plus className="size-3.5" />
          </Button>
        }
        options={options}
        onSelect={handlePick}
        loading={isLoadingReps}
        searchPlaceholder="ابحث عن مندوب..."
        emptyText={options.length ? "لا توجد نتائج" : "تمت إضافة الجميع"}
      />
    </div>
  );
}
