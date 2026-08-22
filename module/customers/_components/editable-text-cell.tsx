"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateCustomerMutation } from "../hooks";

interface EditableTextCellProps {
  value: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  onSave: (value: string) => { id: number; name?: string; email?: string };
}

export function EditableTextCell({
  value,
  placeholder = "-",
  dir = "rtl",
  onSave,
}: EditableTextCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  React.useEffect(() => setDraft(value), [value]);
  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    updateCustomer(onSave(trimmed), {
      onSuccess: () => setEditing(false),
      onError: () => setDraft(value),
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          dir={dir}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          disabled={isPending}
          className="h-8 min-w-[100px] w-full text-sm font-normal"
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
      dir={dir}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="text-sm font-normal text-foreground hover:underline underline-offset-2 decoration-dashed decoration-muted-foreground"
    >
      {value || placeholder}
    </button>
  );
}
