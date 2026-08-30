"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Clickable name cell that opens a profile page (customer/rep/product) without triggering the row's own click handler. */
export function EntityLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
