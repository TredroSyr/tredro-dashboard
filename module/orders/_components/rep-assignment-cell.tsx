"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { AssignRepWithWorkDaysDialog } from "@/module/customers/_components/assign-rep-with-work-days";
import { useAssignRepsMutation } from "@/module/customers/hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import type { CustomerRequest } from "../types";

/**
 * `rep`/`rep_name` are a snapshot of who was notified when the request was
 * filed and stay null forever even after a later assignment — only
 * `needs_rep_assignment` says whether the customer is still unassigned right
 * now. See §4 of the customer-requests doc.
 */
export function RepAssignmentCell({ request }: { request: CustomerRequest }) {
  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { mutate: assignReps, isPending } = useAssignRepsMutation();
  const queryClient = useQueryClient();

  if (request.rep_name) {
    return (
      <EntityLink href={`/reps/detail?id=${request.rep}`}>
        {request.rep_name}
      </EntityLink>
    );
  }

  if (!request.needs_rep_assignment) {
    return (
      <span className="text-sm text-muted-foreground">
        تم تعيين مندوب لاحقاً
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="warning" className="gap-1">
        <IconRenderer name="warning_outlined" className="size-3" />
        بدون مندوب
      </Badge>
      <AssignRepWithWorkDaysDialog
        reps={repsRes?.data?.reps ?? []}
        loading={isLoadingReps}
        disabled={isPending}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="h-6 gap-1 px-2 text-xs"
          >
            <IconRenderer name="assign_outlined" className="size-3.5" />
            تعيين
          </Button>
        }
        onAssign={(assignment) => {
          assignReps(
            { id: request.customer, assignments: [assignment] },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["customerRequests"] });
              },
            },
          );
        }}
      />
    </div>
  );
}
