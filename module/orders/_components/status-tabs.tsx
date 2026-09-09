"use client";

import type { CustomerRequestStatus } from "../types";
import { STATUS_LABEL } from "../lib/format";

const TABS: { key: CustomerRequestStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: STATUS_LABEL.pending },
  { key: "accepted", label: STATUS_LABEL.accepted },
  { key: "fulfilled", label: STATUS_LABEL.fulfilled },
  { key: "rejected", label: STATUS_LABEL.rejected },
  { key: "cancelled", label: STATUS_LABEL.cancelled },
];

export function OrderStatusTabs({
  value,
  onChange,
}: {
  value: CustomerRequestStatus | "all";
  onChange: (status: CustomerRequestStatus | "all") => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition-colors ${
            value === tab.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
