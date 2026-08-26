"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMultiStepContentWidth } from "./context";

export interface MultiStepContentProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function MultiStepContent({
  title,
  description,
  children,
  className,
}: MultiStepContentProps) {
  const contentWidth = useMultiStepContentWidth();

  return (
    <div
      className={cn("flex flex-col gap-6 mx-auto", className)}
      style={
        contentWidth
          ? {
              width:
                typeof contentWidth === "number"
                  ? `${contentWidth}px`
                  : contentWidth,
            }
          : undefined
      }
    >
      {(title || description) && (
        <div className="flex flex-col gap-1 items-center text-center pb-4">
          {title && (
            <h2 className="text-primary text-lg font-semibold">{title}</h2>
          )}
          {description && (
            <p className="text-gray-400 text-sm font-normal">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
