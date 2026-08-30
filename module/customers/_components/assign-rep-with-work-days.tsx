"use client";
import * as React from "react";
import { Plus, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { WorkDayPicker } from "./work-day-picker";
import { WorkDay, Assignment } from "../types";
import { Rep } from "@/module/reps/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface AssignRepWithWorkDaysDialogProps {
  trigger?: React.ReactNode;
  reps: Rep[];
  assignedIds?: Set<string>;
  onAssign: (assignment: Assignment) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AssignRepWithWorkDaysDialog({
  trigger,
  reps,
  assignedIds = new Set(),
  onAssign,
  loading = false,
  disabled = false,
}: AssignRepWithWorkDaysDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedRepId, setSelectedRepId] = React.useState<string | null>(null);
  const [workDays, setWorkDays] = React.useState<WorkDay[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const availableReps = React.useMemo(
    () => reps.filter((r) => !assignedIds.has(String(r.id))),
    [reps, assignedIds],
  );

  const filteredReps = React.useMemo(
    () =>
      availableReps.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [availableReps, searchQuery],
  );

  const selectedRep = React.useMemo(
    () => reps.find((r) => String(r.id) === selectedRepId),
    [reps, selectedRepId],
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedRepId(null);
      setWorkDays([]);
      setSearchQuery("");
    }
  };

  const handleSelectRep = (repId: string) => {
    setSelectedRepId(repId);
    const rep = reps.find((r) => String(r.id) === repId);
    // Default to rep's work days if available
    setWorkDays(rep?.work_days ?? []);
  };

  const handleAssign = () => {
    if (!selectedRepId) return;
    onAssign({
      rep_id: Number(selectedRepId),
      work_days: workDays.length > 0 ? workDays : undefined,
    });
    handleOpenChange(false);
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled || loading}
      className="size-6 rounded-full border border-dashed border-border shrink-0"
    >
      <Plus className="size-3.5" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <div onClick={() => !disabled && setOpen(true)}>{trigger}</div>
      ) : (
        <div onClick={() => !disabled && setOpen(true)}>{defaultTrigger}</div>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            {selectedRepId ? "تخصيص أيام العمل" : "تعيين مندوب"}
          </DialogTitle>
        </DialogHeader>

        {!selectedRepId ? (
          <div className="py-2">
            <Command shouldFilter={false}>
              <CommandInput
              autoFocus
                placeholder="ابحث عن مندوب..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {loading ? (
                  <div className="py-6 text-center text-sm font-normal text-muted-foreground">
                    جارِ التحميل...
                  </div>
                ) : availableReps.length === 0 ? (
                  <CommandEmpty>تمت إضافة جميع المندوبين</CommandEmpty>
                ) : filteredReps.length === 0 ? (
                  <CommandEmpty>لا توجد نتائج</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredReps.map((rep) => (
                      <CommandItem
                        key={rep.id}
                        value={`${rep.name} ${rep.id}`}
                        onSelect={() => handleSelectRep(String(rep.id))}
                        className="flex items-center gap-3"
                      >
                        <Check
                          className={cn(
                            "me-2 h-4 w-4",
                            selectedRepId === String(rep.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-normal">{rep.name}</p>
                          {rep.work_days && rep.work_days.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              أيام العمل الافتراضية: {rep.work_days.length} يوم
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary font-medium">
                {selectedRep?.name.trim().charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedRep?.name}</p>
                {selectedRep?.work_days &&
                  selectedRep.work_days.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      أيام العمل الافتراضية: {selectedRep.work_days.length} يوم
                    </p>
                  )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRepId(null);
                  setWorkDays([]);
                }}
              >
                تغيير
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-right block">
                أيام العمل (اختياري - اتركه فارغاً لاستخدام الافتراضي)
              </Label>
              <WorkDayPicker
                value={workDays}
                onChange={setWorkDays}
                variant="short"
              />
              <p className="text-xs text-muted-foreground text-right">
                إذا لم تختار أيام، سيتم استخدام أيام العمل الافتراضية للمندوب
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row-reverse gap-2">
          {selectedRepId && (
            <Button
              type="button"
              onClick={handleAssign}
              disabled={loading}
            >
              تعيين
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
