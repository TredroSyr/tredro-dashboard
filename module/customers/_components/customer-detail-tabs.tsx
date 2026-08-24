"use client";

import { cn } from "@/lib/utils";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  {
    value: "overview",
    label: "نظرة عامة",
    iconFilled: "overview_filled" as iconName,
    iconOutlined: "overview_outlined" as iconName,
  },
  {
    value: "invoices",
    label: "فواتير",
    iconFilled: "payment_filled" as iconName,
    iconOutlined: "payment_outlined" as iconName,
    countKey: "invoices",
  },
  {
    value: "orders",
    label: "طلبات",
    iconFilled: "cart_filled" as iconName,
    iconOutlined: "cart_outlined" as iconName,
    countKey: "orders",
  },
  {
    value: "reps",
    label: "مندوبون",
    iconFilled: "users_filled" as iconName,
    iconOutlined: "users_outlined" as iconName,
    countKey: "reps",
  },
] as const;

type TabValue = (typeof TABS)[number]["value"];
type CountKey = "invoices" | "orders" | "reps";
type TrendDirection = "up" | "down";

interface TrendData {
  direction: TrendDirection;
  percentage?: number;
}

interface CustomerDetailTabsProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  counts?: Partial<Record<CountKey, number>>;
  trends?: Partial<Record<CountKey, TrendData>>;
  isLoading?: boolean;
}

export function CustomerDetailTabs({
  value,
  onValueChange,
  counts,
  trends,
  isLoading = false,
}: CustomerDetailTabsProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <div
          className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible"
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
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible"
        dir="rtl"
      >
        {TABS.map((tab) => {
          const isActive = value === tab.value;
          const count =
            "countKey" in tab && tab.countKey
              ? counts?.[tab.countKey]
              : undefined;
          const trend =
            "countKey" in tab && tab.countKey
              ? trends?.[tab.countKey]
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

              <div className="flex items-center gap-1.5">
                {trend && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5",
                      trend.direction === "up"
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    <IconRenderer
                      name={
                        trend.direction === "up"
                          ? "arrow_up_filled"
                          : "arrow_down_filled"
                      }
                      className="size-3"
                    />
                    {trend.percentage !== undefined && (
                      <span className="text-xs font-semibold tabular-nums">
                        {trend.percentage}%
                      </span>
                    )}
                  </div>
                )}

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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
