"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/tredro/phone-input";
import { DataTableRowActions } from "./data-table-row-actions";
import { Customer } from "../types";
import { useLongPress } from "../hook/use-long-press";
import { IndeterminateCheckbox } from "./indeterminate-checkbox";

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

  const handleClick = () => {
    if (longPress.wasLongPress()) return;
    if (selectionMode) onToggleSelect();
  };

  return (
    <div
      {...longPress}
      onClick={handleClick}
      className="flex flex-col gap-2 select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectionMode && (
            <IndeterminateCheckbox
              checked={selected}
              onChange={onToggleSelect}
            />
          )}
          <span className="text-sm font-normal text-foreground">
            {customer.name}
          </span>
        </div>
        <Badge variant={customer.is_active ? "default" : "destructive"}>
          {customer.is_active ? "مفعّل" : "موقوف"}
        </Badge>
      </div>

      <PhoneInput value={customer.phone} readOnly />
      <span className="text-sm font-normal text-muted-foreground" dir="ltr">
        {customer.email ?? "-"}
      </span>
      <span className="text-sm font-normal text-muted-foreground">
        {customer.assigned_reps_details?.length
          ? customer.assigned_reps_details.map((r) => r.name).join("، ")
          : "بدون مندوب"}
      </span>

      {!selectionMode && (
        <div className="flex justify-end pt-2 border-t border-border">
          <DataTableRowActions row={{ original: customer }} />
        </div>
      )}
    </div>
  );
}
