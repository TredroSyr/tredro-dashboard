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
    // ملاحظة مهمة: هالـ div ما إله onClick إطلاقًا.
    // التحديد الجماعي بينفعّل فقط عبر:
    //  1) الضغط الطويل (long-press) على أي مكان بالكارت
    //  2) الـ checkbox نفسها بعد ما ينفعّل وضع التحديد
    // وهيك كل الحقول (اسم/هاتف/تصنيف/مندوب/حالة) بتضل شغالة عادي
    // بدون أي تدخل أو stopPropagation، بالضبط متل الجدول.
    <div {...longPress} className="flex flex-col gap-3 select-none">
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            الهاتف
          </span>
          <EditablePhoneCell customer={customer} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            البريد
          </span>
          <EditableTextCell
            value={customer.email ?? ""}
            placeholder="-"
            dir="ltr"
            onSave={(v) => ({ id: customer.id, email: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            التصنيف
          </span>
          <CategoryCell customer={customer} />
        </div>

        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground shrink-0 pt-1">
            المندوبون
          </span>
          <div className="flex justify-end">
            <AssignRepCell customer={customer} />
          </div>
        </div>
      </div>

      {!selectionMode && (
        <div className="flex justify-end pt-2 border-t border-border">
          <DataTableRowActions row={{ original: customer }} />
        </div>
      )}
    </div>
  );
}
