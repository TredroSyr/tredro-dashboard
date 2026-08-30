"use client";
import * as React from "react";
import { Loader2, UserPlus, Tag, UserMinus, TagIcon, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InlineSelectPopover } from "./inline-select-popover";
import { CategoryPickerPopover } from "./category-picker-popover";
import { WorkDayPicker } from "./work-day-picker";
import { useRepsQuery } from "@/module/reps/hooks";
import { useBulkActionMutation } from "../hooks";
import { Customer, WorkDay } from "../types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface BulkActionsBarProps {
  selectedCustomers: Customer[];
  clearSelection: () => void;
  variant?: "full" | "compact";
}

export function BulkActionsBar({
  selectedCustomers,
  clearSelection,
  variant = "full",
}: BulkActionsBarProps) {
  const ids = selectedCustomers.map((c) => c.id);
  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { mutate: runBulkAction, isPending } = useBulkActionMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [assignRepOpen, setAssignRepOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const [selectedRepId, setSelectedRepId] = React.useState<string | null>(null);
  const [workDays, setWorkDays] = React.useState<WorkDay[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const isCompact = variant === "compact";

  const reps = repsRes?.data?.reps ?? [];

  const repOptions = React.useMemo(
    () =>
      reps.map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [reps],
  );

  const filteredReps = React.useMemo(
    () =>
      reps.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [reps, searchQuery],
  );

  const selectedRep = React.useMemo(
    () => reps.find((r) => String(r.id) === selectedRepId),
    [reps, selectedRepId],
  );

  const showResult = (res: {
    data: { successful: number; failed: number; failed_ids: number[] };
  }) => {
    if (res.data.failed > 0) {
      setFeedback(
        `نجح: ${res.data.successful}، فشل: ${
          res.data.failed
        } (${res.data.failed_ids.join(", ")})`,
      );
    } else {
      setFeedback(null);
    }
  };

  const handleSelectRep = (repId: string) => {
    setSelectedRepId(repId);
    const rep = reps.find((r) => String(r.id) === repId);
    setWorkDays(rep?.work_days ?? []);
  };

  const handleAssignRepConfirm = () => {
    if (!selectedRepId) return;
    runBulkAction(
      {
        action: "assign_rep",
        customer_ids: ids,
        rep_id: Number(selectedRepId),
        work_days: workDays.length > 0 ? workDays : undefined,
      },
      {
        onSuccess: (res) => {
          showResult(res);
          clearSelection();
          setAssignRepOpen(false);
          setSelectedRepId(null);
          setWorkDays([]);
          setSearchQuery("");
        },
      },
    );
  };

  const handleAssignRepOpenChange = (open: boolean) => {
    setAssignRepOpen(open);
    if (!open) {
      setSelectedRepId(null);
      setWorkDays([]);
      setSearchQuery("");
    }
  };

  const handleRemoveRep = (repId: string) => {
    runBulkAction(
      { action: "remove_rep", customer_ids: ids, rep_id: Number(repId) },
      {
        onSuccess: (res) => {
          showResult(res);
          clearSelection();
        },
      },
    );
  };

  const handleAssignCategory = (categoryId: string) => {
    runBulkAction(
      {
        action: "assign_category",
        customer_ids: ids,
        category_id: Number(categoryId),
      },
      {
        onSuccess: (res) => {
          showResult(res);
          clearSelection();
        },
      },
    );
  };

  const handleRemoveCategory = () => {
    runBulkAction(
      { action: "remove_category", customer_ids: ids },
      {
        onSuccess: (res) => {
          showResult(res);
          clearSelection();
        },
      },
    );
  };

  const handleDelete = () => {
    runBulkAction(
      { action: "delete", customer_ids: ids },
      {
        onSuccess: (res) => {
          showResult(res);
          setDeleteOpen(false);
          clearSelection();
        },
      },
    );
  };

  const buttonSize = isCompact ? "sm" : "sm";
  const buttonClass = isCompact
    ? "justify-center shrink-0 gap-1.5 whitespace-nowrap"
    : "justify-start w-full sm:w-auto";

  return (
    <>
      <div className={cn("flex flex-col gap-3", isCompact && "gap-2")}>
        {!isCompact && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="font-normal">
                {selectedCustomers.length} عميل محدد
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                إلغاء التحديد
              </Button>
              {isPending && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size={buttonSize}
                className={buttonClass}
                onClick={() => setAssignRepOpen(true)}
              >
                <UserPlus className="size-4" />
                تعيين مندوب
              </Button>

              <InlineSelectPopover
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size={buttonSize}
                    className={buttonClass}
                  >
                    <UserMinus className="size-4" />
                    إزالة مندوب
                  </Button>
                }
                options={repOptions}
                onSelect={handleRemoveRep}
                loading={isLoadingReps}
                searchPlaceholder="ابحث عن مندوب..."
                emptyText="لا يوجد مندوبون"
              />

              <CategoryPickerPopover
                onSelect={handleAssignCategory}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size={buttonSize}
                    className={buttonClass}
                  >
                    <Tag className="size-4" />
                    تعيين تصنيف
                  </Button>
                }
              />

              <Button
                type="button"
                variant="outline"
                size={buttonSize}
                disabled={isPending}
                onClick={handleRemoveCategory}
                className={buttonClass}
              >
                <TagIcon className="size-4" />
                إزالة التصنيف
              </Button>

              <Button
                type="button"
                variant="destructive"
                size={buttonSize}
                onClick={() => setDeleteOpen(true)}
                className={cn(buttonClass, "col-span-2 sm:col-span-1")}
              >
                <Ban className="size-4" />
                تعطيل المحدد
              </Button>
            </div>
          </div>
        )}

        {isCompact && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={buttonClass}
              onClick={() => setAssignRepOpen(true)}
            >
              <UserPlus className="size-4" />
              مندوب
            </Button>

            <InlineSelectPopover
              trigger={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={buttonClass}
                >
                  <UserMinus className="size-4" />
                  إزالة مندوب
                </Button>
              }
              options={repOptions}
              onSelect={handleRemoveRep}
              loading={isLoadingReps}
              searchPlaceholder="ابحث عن مندوب..."
              emptyText="لا يوجد مندوبون"
            />

            <CategoryPickerPopover
              onSelect={handleAssignCategory}
              trigger={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={buttonClass}
                >
                  <Tag className="size-4" />
                  تصنيف
                </Button>
              }
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={handleRemoveCategory}
              className={buttonClass}
            >
              <TagIcon className="size-4" />
              إزالة التصنيف
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className={buttonClass}
            >
              <Ban className="size-4" />
              تعطيل
            </Button>
          </div>
        )}

        {feedback && (
          <p className="text-xs font-normal text-destructive">{feedback}</p>
        )}
      </div>

      {/* Assign Rep with Work Days Dialog */}
      <Dialog open={assignRepOpen} onOpenChange={handleAssignRepOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {selectedRepId ? "تخصيص أيام العمل" : "تعيين مندوب للعملاء المحددين"}
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
                  {isLoadingReps ? (
                    <div className="py-6 text-center text-sm font-normal text-muted-foreground">
                      جارِ التحميل...
                    </div>
                  ) : reps.length === 0 ? (
                    <CommandEmpty>لا يوجد مندوبون</CommandEmpty>
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
                <div className="flex-1">
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
                onClick={handleAssignRepConfirm}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 me-2 animate-spin" />
                    جارٍ التعيين...
                  </>
                ) : (
                  "تعيين"
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAssignRepOpenChange(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">
              تعطيل العملاء المحددين
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-normal text-muted-foreground text-right">
            سيتم تعطيل {selectedCustomers.length} عميل. يمكن التراجع لاحقاً
            بإعادة تفعيلهم.
          </p>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              تعطيل
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
