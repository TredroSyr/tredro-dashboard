"use client";
import * as React from "react";
import { Phone, Hash, X, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PhoneInput } from "@/components/tredro/phone-input";
import { EntityLink } from "@/module/invoices/_components/entity-link";
import { WorkDaysTag } from "./work-day-picker";
import { Customer } from "../types";
import { useRemoveRepsMutation } from "../hooks";

interface CustomerRepsPanelProps {
  customer: Customer;
}

// Shows the reps already assigned to this customer (from assigned_reps_details)
// as info cards — assigning/removing a rep is done elsewhere (AssignRepCell),
// this is a read-focused view with a quick unassign action.
export function CustomerRepsPanel({ customer }: CustomerRepsPanelProps) {
  const reps = customer.assigned_reps_details ?? [];
  const { mutate: removeReps, isPending: isRemoving } = useRemoveRepsMutation();

  if (reps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          لا يوجد مندوبون مرتبطون بهذا العميل
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reps.map((rep) => (
        <Card key={rep.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {rep.name.trim().charAt(0)}
                </span>
                <EntityLink
                  href={`/reps/detail?id=${rep.id}`}
                  className="font-medium truncate"
                >
                  {rep.name}
                </EntityLink>
              </div>
              <button
                type="button"
                title="إزالة المندوب"
                disabled={isRemoving}
                onClick={() =>
                  removeReps({ id: customer.id, rep_ids: [rep.id] })
                }
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <PhoneInput value={rep.phone} readOnly />
            </div>

            {rep.referral_code && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="size-3.5 shrink-0" />
                <span dir="ltr">{rep.referral_code}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground shrink-0">
                أيام الزيارة:
              </span>
              <WorkDaysTag days={rep.work_days} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
