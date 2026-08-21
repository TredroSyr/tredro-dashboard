// app/(protected)/reps/[id]/rep-detail-tabs.tsx
"use client";
import * as React from "react";
import { LayoutGrid, Receipt, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "overview", label: "نظرة عامة", icon: LayoutGrid },
  { value: "invoices", label: "فواتير", icon: Receipt, countKey: "invoices" },
  { value: "orders", label: "طلبات", icon: ShoppingCart, countKey: "orders" },
  { value: "customers", label: "زبائن", icon: Users, countKey: "customers" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

interface RepDetailTabsProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  counts?: Partial<Record<"invoices" | "orders" | "customers", number>>;
}

export function RepDetailTabs({
  value,
  onValueChange,
  counts,
}: RepDetailTabsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4">
      {TABS.map((tab) => {
        const Icon = tab.icon;
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
              "flex items-center justify-between rounded-xl border px-4 py-3 text-right transition-colors",
              isActive
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-muted/50",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={cn(
                  "size-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
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
  );
}
