"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { PhoneInput } from "@/components/tredro/phone-input";
import { Customer } from "../types";
import { useUpdateCustomerMutation } from "../hooks";

export function EditablePhoneCell({ customer }: { customer: Customer }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(customer.phone);

  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  React.useEffect(() => setDraft(customer.phone), [customer.phone]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed === customer.phone) {
      setEditing(false);
      return;
    }
    updateCustomer(
      { id: customer.id, phone: trimmed },
      {
        onSuccess: () => setEditing(false),
        onError: () => setDraft(customer.phone),
      },
    );
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <PhoneInput
          value={draft}
          onChange={setDraft}
          className="h-8"
          disabled={isPending}
        />
        {isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="button"
            onClick={save}
            className="text-xs text-primary shrink-0"
          >
            حفظ
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="hover:underline underline-offset-2 decoration-dashed decoration-muted-foreground"
    >
      <PhoneInput value={customer.phone} readOnly />
    </button>
  );
}
