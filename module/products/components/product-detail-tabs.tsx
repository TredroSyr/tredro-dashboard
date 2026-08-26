"use client";

import { AlertCircle } from "lucide-react";
import { FieldErrors } from "react-hook-form";
import { cn } from "@/lib/utils";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { getTabHasError, getVisibleTabs, ProductTabValue } from "../constant";
import { ProductFormValues } from "../schema";

interface ProductDetailTabsProps {
  mode: "create" | "edit";
  value: ProductTabValue;
  onValueChange: (value: ProductTabValue) => void;
  errors: FieldErrors<ProductFormValues>;
  pricesCount: number;
  imagesCount: number;
}

export const ProductDetailTabs = ({
  mode,
  value,
  onValueChange,
  errors,
  pricesCount,
  imagesCount,
}: ProductDetailTabsProps) => {
  const tabs = getVisibleTabs(mode);
  const counts: Record<string, number> = {
    pricing: pricesCount,
    images: imagesCount,
  };

  return (
    <div className="px-6 py-4">
      <div
        className={cn(
          "flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible",
          mode === "create"
            ? "sm:grid sm:grid-cols-6"
            : "sm:grid sm:grid-cols-7",
        )}
        dir="rtl"
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          const hasError = getTabHasError(
            tab.value,
            errors as Record<string, unknown>,
          );
          const count = counts[tab.value];
          const isRequiredEmpty = tab.value === "pricing" && count === 0;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "flex shrink-0 cursor-pointer snap-start items-center justify-between gap-4 rounded-xl border px-4 py-3 text-right transition-colors",
                "w-[65%] xs:w-[45%] sm:w-auto",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/50",
                hasError && !isActive && "border-destructive/50",
              )}
            >
              <div className="flex items-center gap-2">
                <IconRenderer
                  name={isActive ? tab.iconFilled : tab.iconOutlined}
                  className={cn(
                    "size-4",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                >
                  {tab.label}
                  {isRequiredEmpty && (
                    <span className="text-destructive"> *</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasError && (
                  <AlertCircle className="size-3.5 text-destructive" />
                )}
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
