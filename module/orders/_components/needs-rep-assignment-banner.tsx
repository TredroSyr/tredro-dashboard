"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { AssignRepWithWorkDaysDialog } from "@/module/customers/_components/assign-rep-with-work-days";
import { useAssignRepsMutation } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";

/**
 * `needs_rep_assignment` is per customer, not per request — six requests from
 * the same unassigned customer all carry `true`. When a list is already
 * scoped to one customer (their "orders" tab), collapse that into a single
 * banner instead of a chip on every row. See §4 of the customer-requests doc.
 */
export function NeedsRepAssignmentBanner({
  customerId,
  customerName,
}: {
  customerId: number;
  customerName?: string;
}) {
  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { mutate: assignReps, isPending } = useAssignRepsMutation();
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-warning-foreground">
            لا يوجد مندوب معيّن لهذا العميل
          </p>
          <p className="text-xs text-warning-foreground/80">
            طلبات {customerName ?? "هذا العميل"} لم تصل لأي مندوب. عيّن مندوباً
            ليتابع زياراته من الآن فصاعداً.
          </p>
        </div>
      </div>
      <AssignRepWithWorkDaysDialog
        reps={repsRes?.data?.reps ?? []}
        loading={isLoadingReps}
        disabled={isPending}
        trigger={
          <Button type="button" size="sm" disabled={isPending} className="gap-1.5">
            <IconRenderer name="assign_outlined" className="size-3.5" />
            تعيين مندوب
          </Button>
        }
        onAssign={(assignment) => {
          assignReps(
            { id: customerId, assignments: [assignment] },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["customerRequests"] });
                queryClient.invalidateQueries({ queryKey: ["customers", "detail"] });
              },
            },
          );
        }}
      />
    </div>
  );
}
