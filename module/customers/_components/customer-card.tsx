"use client";
import * as React from "react";

import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { CategoryCell } from "./category-cell";
import { EditableStatusCell } from "./editable-status-cell";
import { WorkDaysCell } from "./work-days-cell";
import { Customer } from "../types";
import { useLongPress } from "../hook/use-long-press";
import { IndeterminateCheckbox } from "./indeterminate-checkbox";
import { PhoneInput } from "@/components/tredro/phone-input";

interface CustomerCardProps {
  customer: Customer;
  selectionMode: boolean;
  selected: boolean;
  onEnterSelectionMode: () => void;
  onToggleSelect: () => void;
}

export function CustomerCard({
  customer,
  selectionMode,
  selected,
  onEnterSelectionMode,
  onToggleSelect,
}: CustomerCardProps) {
  const longPress = useLongPress(() => {
    onEnterSelectionMode();
  }, 500);

  return (
    <div {...longPress} className="flex flex-col gap-2.5 select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selectionMode && (
            <IndeterminateCheckbox
              checked={selected}
              onChange={onToggleSelect}
            />
          )}
          <span className="text-sm font-normal truncate">{customer.name}</span>
        </div>
        <EditableStatusCell customer={customer} />
      </div>

      <PhoneInput value={customer.phone} readOnly />

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryCell customer={customer} />
        <AssignRepCell customer={customer} />
      </div>

      {(customer.assigned_reps_details?.length ?? 0) > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">
            أيام الزيارة:
          </span>
          <WorkDaysCell customer={customer} />
        </div>
      )}

      {!selectionMode && (
        <div className="flex justify-end pt-2 border-t border-border">
          <DataTableRowActions row={{ original: customer }} />
        </div>
      )}
    </div>
  );
}
