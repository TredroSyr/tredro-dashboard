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
import { InlineSelectPopover } from "./inline-select-popover";
import { CategoryPickerPopover } from "./category-picker-popover";
import { useRepsQuery } from "@/module/reps/hooks";
import { useBulkActionMutation } from "../hooks";
import { Customer } from "../types";
import { cn } from "@/lib/utils";

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
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const isCompact = variant === "compact";

  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
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

  const handleAssignRep = (repId: string) => {
    runBulkAction(
      { action: "assign_rep", customer_ids: ids, rep_id: Number(repId) },
      {
        onSuccess: (res) => {
          showResult(res);
          clearSelection();
        },
      },
    );
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
              <InlineSelectPopover
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size={buttonSize}
                    className={buttonClass}
                  >
                    <UserPlus className="size-4" />
                    تعيين مندوب
                  </Button>
                }
                options={repOptions}
                onSelect={handleAssignRep}
                loading={isLoadingReps}
                searchPlaceholder="ابحث عن مندوب..."
                emptyText="لا يوجد مندوبون"
              />

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
            <InlineSelectPopover
              trigger={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={buttonClass}
                >
                  <UserPlus className="size-4" />
                  مندوب
                </Button>
              }
              options={repOptions}
              onSelect={handleAssignRep}
              loading={isLoadingReps}
              searchPlaceholder="ابحث عن مندوب..."
              emptyText="لا يوجد مندوبون"
            />

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
