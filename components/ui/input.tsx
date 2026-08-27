import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function Input({
  className,
  type,
  isLoading = false,
  min,
  max,
  onChange,
  ...props
}: React.ComponentProps<"input"> & { isLoading?: boolean }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number" && (min !== undefined || max !== undefined)) {
      const value = e.target.value;

      if (value !== "" && value !== "-") {
        const num = Number(value);

        if (!Number.isNaN(num)) {
          let clamped = num;

          if (max !== undefined && num > Number(max)) {
            clamped = Number(max);
          }

          if (min !== undefined && num < Number(min)) {
            clamped = Number(min);
          }

          if (clamped !== num) {
            e.target.value = String(clamped);
          }
        }
      }
    }

    onChange?.(e);
  };

  if (isLoading) {
    return (
      <Skeleton
        data-slot="input"
        className={cn("h-8 w-full rounded-lg", className)}
      />
    );
  }

  return (
    <InputPrimitive
      type={type}
      min={min}
      max={max}
      onChange={handleChange}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary   disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
