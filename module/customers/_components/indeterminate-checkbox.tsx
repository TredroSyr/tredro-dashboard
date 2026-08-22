"use client";
import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndeterminateCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function IndeterminateCheckbox({
  checked,
  indeterminate = false,
  onChange,
  className,
}: IndeterminateCheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !checked && indeterminate;
    }
  }, [checked, indeterminate]);

  const isVisuallyChecked = checked && !indeterminate;
  const isVisuallyIndeterminate = indeterminate && !checked;

  return (
    <label
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary cursor-pointer transition-colors",
          (isVisuallyChecked || isVisuallyIndeterminate) &&
            "bg-primary border-primary",
        )}
      >
        {isVisuallyChecked && (
          <Check className="h-3 w-3 text-primary-foreground" />
        )}
        {isVisuallyIndeterminate && (
          <Minus className="h-3 w-3 text-primary-foreground" />
        )}
      </span>
    </label>
  );
}
