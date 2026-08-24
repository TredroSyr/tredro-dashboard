"use client";
import * as React from "react";
import { Plus, X, Edit2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { InlineSelectPopover } from "./inline-select-popover";
import { WorkDayPicker, getWorkDayLabel, getWorkDayShortLabel } from "./work-day-picker";
import { Customer, Assignment, WorkDay } from "../types";
import { useAssignRepsMutation, useRemoveRepsMutation } from "../hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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

  const handleUpdateWorkDays = (repId: number, workDays: WorkDay[]) => {
    assignReps({
      id: customer.id,
      assignments: [{
        rep_id: repId,
        work_days: workDays.length > 0 ? workDays : undefined,
      }],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 max-w-[350px]">
      {assignedReps.length === 0 && (
        <span className="text-sm font-normal text-muted-foreground">
          بدون مندوب
        </span>
      )}
      {assignedReps.map((rep) => (
        <RepBadgeWithWorkDays
          key={rep.id}
          rep={rep}
          onRemove={() => handleRemove(rep.id)}
          onUpdateWorkDays={(days) => handleUpdateWorkDays(rep.id, days)}
          isRemoving={isRemoving}
        />
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

interface RepBadgeWithWorkDaysProps {
  rep: {
    id: number;
    name: string;
    work_days?: string[];
  };
  onRemove: () => void;
  onUpdateWorkDays: (days: WorkDay[]) => void;
  isRemoving: boolean;
}

function RepBadgeWithWorkDays({
  rep,
  onRemove,
  onUpdateWorkDays,
  isRemoving,
}: RepBadgeWithWorkDaysProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [workDays, setWorkDays] = React.useState<WorkDay[]>(
    (rep.work_days as WorkDay[]) ?? [],
  );


  const handleSave = () => {
    onUpdateWorkDays(workDays);
    setEditOpen(false);
  };

  return (
    <>
      <Badge
        variant="secondary"
        className="gap-1.5 pr-1 font-normal flex-col items-start py-1.5 h-auto"
      >
        <div className="flex items-center gap-1.5 w-full">
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
            {rep.name.trim().charAt(0)}
          </span>
          <span className="text-sm">{rep.name}</span>
          <button
            type="button"
            disabled={isRemoving}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
            className="rounded-full hover:bg-muted-foreground/20 disabled:opacity-50 text-muted-foreground hover:text-foreground"
            title="تعديل أيام العمل"
          >
            <Edit2 className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={isRemoving}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="me-auto rounded-full hover:bg-muted-foreground/20 disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        </div>
    
      </Badge>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              تعديل أيام العمل: {rep.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-right block">
                حدد أيام زيارة المندوب لهذا العميل
              </Label>
              <WorkDayPicker
                value={workDays}
                onChange={setWorkDays}
                variant="full"
              />
              <p className="text-xs text-muted-foreground text-right">
                اترك كل الأيام غير محددة لاستخدام أيام العمل الافتراضية للمندوب
              </p>
            </div>

            {/* Preview */}
            {workDays.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <Label className="text-right block text-sm">
                  الأيام المحددة:
                </Label>
                <div className="flex flex-wrap gap-1 justify-end">
                  {workDays.map((day) => (
                    <span
                      key={day}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                    >
                      {getWorkDayLabel(day)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button type="button" onClick={handleSave}>
              حفظ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
