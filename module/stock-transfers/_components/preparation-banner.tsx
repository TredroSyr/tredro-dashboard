"use client";

import * as React from "react";
import { X, Clock, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePreparationStore } from "../store/preparation-store";
import { useRouter } from "next/navigation";

function getRemainingTime(expiresAt: number): string {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return "انتهى الوقت";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes > 0) {
      return `${diffHours} ساعة و ${remainingMinutes} دقيقة`;
    }
    return `${diffHours} ساعة`;
  }
  return `${diffMinutes} دقيقة`;
}

interface PreparationBannerProps {
  currentTransferId?: number;
}

export function PreparationBanner({ currentTransferId }: PreparationBannerProps) {
  const router = useRouter();
  const { getActivePreparations, removePreparation, getPreparation } =
    usePreparationStore();

  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 30000);
    return () => clearInterval(interval);
  }, []);

  const activePreparations = getActivePreparations();

  if (activePreparations.length === 0) return null;

  return (
    <div className="border-b border-border bg-amber-50 dark:bg-amber-950/30">
      <div className="px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                تحضير الطلبات جارٍ
              </span>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700"
              >
                مدة صلاحية القائمة: ساعة واحدة من وقت البدء
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activePreparations.map((p) => {
              const isCurrent =
                currentTransferId !== undefined && p.transferId === currentTransferId;
              const checkedCount = p.lines.filter((l) => l.checked).length;
              const totalCount = p.lines.length;
              const isComplete = checkedCount === totalCount;
              const remainingTime = getRemainingTime(p.expiresAt);
              const isExpired = remainingTime === "انتهى الوقت";

              return (
                <Card
                  key={p.transferId}
                  className={`flex items-center gap-3 px-4 py-2 ${
                    isCurrent
                      ? "ring-2 ring-amber-500 dark:ring-amber-400"
                      : ""
                  } ${
                    isExpired
                      ? "bg-red-50 dark:bg-red-950/20"
                      : "bg-white dark:bg-card"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/stock-transfers/detail?id=${p.transferId}`)
                    }
                    className="flex items-center gap-3 text-right hover:opacity-80"
                  >
                    <div>
                      <span
                        className="font-medium tabular-nums"
                        dir="ltr"
                      >
                        {p.transferNumber}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span
                          className={
                            isExpired ? "text-destructive font-medium" : ""
                          }
                        >
                          {remainingTime}
                        </span>
                        <span className="mx-1">·</span>
                        <span
                          className={`flex items-center gap-1 ${
                            isComplete ? "text-green-600 dark:text-green-400" : ""
                          }`}
                        >
                          {isComplete && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span className="tabular-nums" dir="ltr">
                            {checkedCount}/{totalCount}
                          </span>
                        </span>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreparation(p.transferId);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
