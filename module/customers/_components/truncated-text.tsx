"use client";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
  maxChars?: number;
}

export function TruncatedText({
  text,
  className,
  maxChars = 30,
}: TruncatedTextProps) {
  const shouldTruncate = text.length > maxChars;

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  const truncatedText = text.slice(0, maxChars) + "...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className={cn("cursor-help", className)}>
            {truncatedText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface TruncatedCellProps {
  text: string;
  className?: string;
  maxWidth?: string;
}

export function TruncatedCell({
  text,
  className,
  maxWidth = "150px",
}: TruncatedCellProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span
            className={cn(
              "inline-block max-w-full truncate cursor-help",
              className
            )}
            style={{ maxWidth }}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
