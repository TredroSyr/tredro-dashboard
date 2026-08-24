"use client";
import * as React from "react";

import { DataTableRowActions } from "./data-table-row-actions";
import { AssignRepCell } from "./assign-rep-cell";
import { CategoryCell } from "./category-cell";
import { EditableTextCell } from "./editable-text-cell";
import { EditablePhoneCell } from "./editable-phone-cell";
import { EditableStatusCell } from "./editable-status-cell";
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
          <EditableTextCell
            value={customer.name}
            onSave={(v) => ({ id: customer.id, name: v })}
          />
        </div>
        <EditableStatusCell customer={customer} />
      </div>

      <PhoneInput value={customer.phone} readOnly />

      <EditableTextCell
        value={customer.email ?? ""}
        placeholder="بدون بريد إلكتروني"
        dir="ltr"
        onSave={(v) => ({ id: customer.id, email: v })}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryCell customer={customer} />
        <AssignRepCell customer={customer} />
      </div>

      {!selectionMode && (
        <div className="flex justify-end pt-2 border-t border-border">
          <DataTableRowActions row={{ original: customer }} />
        </div>
      )}
    </div>
  );
}
