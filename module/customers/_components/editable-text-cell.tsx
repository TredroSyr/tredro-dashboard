"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateCustomerMutation } from "../hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditableTextCellProps {
  value: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  maxWidth?: string;
  onSave: (value: string) => { id: number; name?: string; email?: string };
}

export function EditableTextCell({
  value,
  placeholder = "-",
  dir = "rtl",
  maxWidth,
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
      <div className="flex items-center gap-1.5" style={{ maxWidth }}>
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
          className="h-8 min-w-[80px] w-full text-sm font-normal"
        />
        {isPending && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const displayValue = value || placeholder;
  const hasValue = !!value;

  const buttonContent = (
    <button
      type="button"
      dir={dir}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        "text-sm font-normal hover:underline underline-offset-2 decoration-dashed decoration-muted-foreground",
        hasValue ? "text-foreground" : "text-muted-foreground"
      )}
      style={{ maxWidth }}
    >
      <span className="block truncate">{displayValue}</span>
    </button>
  );

  // Show tooltip if there's a value and maxWidth is set
  if (maxWidth && hasValue) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm" dir={dir}>{value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}
