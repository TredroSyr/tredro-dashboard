"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Customer } from "../types";
import { useUpdateCustomerMutation } from "../hooks";

export function EditableNameCell({ customer }: { customer: Customer }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(customer.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  React.useEffect(() => setValue(customer.name), [customer.name]);
  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === customer.name) {
      setValue(customer.name);
      setEditing(false);
      return;
    }
    updateCustomer(
      { id: customer.id, name: trimmed },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(customer.name);
              setEditing(false);
            }
          }}
          disabled={isPending}
          className="h-8 min-w-[120px] w-full text-sm"
        />
        {isPending && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-sm font-medium text-foreground text-right hover:underline underline-offset-2 decoration-dashed"
    >
      {customer.name || "-"}
    </button>
  );
}
