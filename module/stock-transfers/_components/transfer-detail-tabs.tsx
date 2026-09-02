"use client";

import { cn } from "@/lib/utils";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  {
    value: "items",
    label: "الأصناف",
    iconFilled: "list_filled" as iconName,
    iconOutlined: "list_outlined" as iconName,
    countKey: "lines" as const,
  },
  {
    value: "history",
    label: "السجل",
    iconFilled: "history_filled" as iconName,
    iconOutlined: "history_outlined" as iconName,
  },
] as const;

type TabValue = (typeof TABS)[number]["value"];
type CountKey = "lines";

interface TransferDetailTabsProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  counts?: Partial<Record<CountKey, number>>;
  isLoading?: boolean;
}

export function TransferDetailTabs({
  value,
  onValueChange,
  counts,
  isLoading = false,
}: TransferDetailTabsProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <div
          className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible"
          dir="rtl"
        >
          {TABS.map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-14 rounded-xl border",
                "w-[65%] xs:w-[45%] sm:w-full",
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible"
        dir="rtl"
      >
        {TABS.map((tab) => {
          const isActive = value === tab.value;
          const count =
            "countKey" in tab && tab.countKey
              ? counts?.[tab.countKey]
              : undefined;

          return (
            <button
              key={tab.value}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "flex shrink-0 cursor-pointer snap-start items-center justify-between gap-4 rounded-xl border px-4 py-3 text-right transition-colors",
                "w-[65%] xs:w-[45%] sm:w-auto",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/50",
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
                </span>
              </div>

              {count !== undefined && (
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
