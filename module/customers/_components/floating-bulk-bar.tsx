"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Customer } from "../types";
import { BulkActionsBar } from "./bulk-assign-bar";

interface FloatingBulkBarProps {
  selectedCustomers: Customer[];
  clearSelection: () => void;
}

export function FloatingBulkBar({
  selectedCustomers,
  clearSelection,
}: FloatingBulkBarProps) {
  const visible = selectedCustomers.length > 0;

  return (
    <div
      className={`
        lg:hidden fixed inset-x-0 bottom-0 z-50
        transition-transform duration-200 ease-out
        ${visible ? "translate-y-0" : "translate-y-full pointer-events-none"}
      `}
    >
      <div
        className="
          mx-3 mb-3 rounded-2xl border border-border bg-background
          shadow-[0_-4px_24px_rgba(0,0,0,0.12)]
          pb-[env(safe-area-inset-bottom)]
        "
      >
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="font-normal">
                {selectedCustomers.length} محدد
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="size-8"
            >
              <X className="size-4" />
            </Button>
          </div>

          {visible && (
            <BulkActionsBar
              selectedCustomers={selectedCustomers}
              clearSelection={clearSelection}
              variant="compact"
            />
          )}
        </div>
      </div>
    </div>
  );
}
