"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { SidebarProps } from "./types";
import { SlotComponent } from "./SlotComponent";
import { useContainerContext } from "./context";
import { useSlotHiding } from "./hooks/useSlotHiding";
import { useContentHeightStyle } from "./hooks/useContentHeightStyle";
import Link from "next/link";

/**
 * Sidebar - Sidebar navigation component
 * Supports two modes:
 * 1. Custom children: Render any custom content
 * 2. Items array: Render a styled navigation list with icons and active states
 *
 * @param children - Custom sidebar content (takes precedence over items)
 * @param items - Array of navigation items to render
 * @param basePath - Base path for resolving relative hrefs (strips locale prefix)
 * @param showBorder - Whether to show the trailing border (default: true)
 * @param hide - Whether to hide the sidebar (default: false)
 * @param isLoading - Whether to show skeleton loading state (default: false)
 */

// Skeleton item component
function SidebarSkeletonItem() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-4 h-4 rounded bg-border-tertiary animate-pulse shrink-0" />
      <div
        className="h-3.5 rounded bg-border-tertiary animate-pulse"
        style={{ width: `${Math.floor(Math.random() * 40) + 50}%` }}
      />
    </div>
  );
}

export function Sidebar({
  children,
  className,
  items,
  basePath,
  showBorder = true,
  hide = false,
  isLoading = false,
}: SidebarProps) {
  const pathname = usePathname();
  const stripQuery = React.useCallback(
    (value: string) => value.split("?")[0],
    [],
  );
  const normalizedPath = stripQuery(pathname).replace(/^\/(en|ar)/, "");
  console.log({ pathname, normalizedPath });
  const { resolveHref } = useContainerContext();
  const heightStyle = useContentHeightStyle();

  // Handle slot hiding pattern
  useSlotHiding("sidebar", hide);

  const customBasePath = React.useMemo(() => {
    if (!basePath) return null;
    const trimmed = basePath
      .replace(/^\/+/, "")
      .replace(/^en\//, "")
      .replace(/^ar\//, "");
    if (!trimmed) {
      return "/";
    }
    return `/${trimmed}`;
  }, [basePath]);

  const resolveSidebarHref = React.useCallback(
    (href: string) => {
      if (!href || href === ".") {
        return customBasePath ?? resolveHref(href || "");
      }
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return href;
      }
      if (href.startsWith("/")) {
        return href;
      }

      if (customBasePath) {
        const normalized = href.replace(/^\/+/, "");
        return normalized
          ? `${customBasePath.replace(/\/$/, "")}/${normalized}`
          : customBasePath;
      }

      return resolveHref(href);
    },
    [customBasePath, resolveHref],
  );

  // If hide is true, don't render anything
  if (hide) {
    return null;
  }

  if (children) {
    return (
      <SlotComponent
        slotType="sidebar"
        className={cn("overflow-y-auto", className)}
        style={heightStyle}
      >
        {children}
      </SlotComponent>
    );
  }

  if (isLoading) {
    return (
      <SlotComponent
        slotType="sidebar"
        className={cn("overflow-y-auto", className)}
        style={heightStyle}
      >
        <div
          className={cn(
            "w-full lg:min-w-43.75 px-1.5 pt-3 flex flex-col gap-3",
            showBorder &&
              "border-b border-border-tertiary pb-3 lg:border-b-0 lg:pb-0 lg:border-e lg:pe-2",
          )}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <SidebarSkeletonItem key={i} />
          ))}
        </div>
      </SlotComponent>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <SlotComponent
      slotType="sidebar"
      className={cn("overflow-y-auto", className)}
      style={heightStyle}
    >
      <div
        className={cn(
          "w-full lg:min-w-43.75 px-1.5 pt-3 flex flex-col gap-3",
          showBorder &&
            "border-b border-border-tertiary pb-3 lg:border-b-0 lg:pb-0 lg:border-e lg:pe-2",
        )}
      >
        {items.map((item) => {
          const absoluteHref = resolveSidebarHref(item.href);
          const normalizedHref = stripQuery(absoluteHref).replace(
            /^\/(en|ar)/,
            "",
          );
          const isDisabled = Boolean(item.disabled || item.locked);
          let isActive: boolean;

          if (item.exact) {
            const startsWithHref = normalizedPath === normalizedHref;
            const nextSegment =
              normalizedPath.slice(normalizedHref.length + 1).split("/")[0] ||
              "";
            const startsWithHrefAndId =
              normalizedPath.startsWith(`${normalizedHref}/`) &&
              /^\d+$/.test(nextSegment);
            const startsWithHrefAndNewOrCreate =
              normalizedPath.startsWith(`${normalizedHref}/`) &&
              (nextSegment === "new" || nextSegment === "create");

            isActive =
              startsWithHref ||
              startsWithHrefAndId ||
              startsWithHrefAndNewOrCreate;
          } else {
            isActive = normalizedPath.startsWith(normalizedHref);
          }

          const shouldShowActive = isActive && !isDisabled;

          const linkContent = (
            <Link
              key={`${item.label}-${item.href}`}
              href={absoluteHref}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onClick={(e: React.MouseEvent) => {
                if (isDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 text-sm font-normal text-gray-500 hover:text-brand-600 transition-all cursor-pointer rounded-lg",
                shouldShowActive && "text-brand-700 font-medium",
                isDisabled &&
                  "opacity-50 cursor-not-allowed hover:text-gray-500 pointer-events-none",
              )}
            >
              {item.icon && (
                <IconRenderer
                  name={item.icon}
                  className={cn(
                    "w-4 h-4 transition-colors",
                    shouldShowActive
                      ? "text-brand-600"
                      : "text-gray-400 group-hover:text-brand-600",
                  )}
                />
              )}
              <span className="truncate">{item.label}</span>
              {item.locked && (
                <IconRenderer
                  name="lock_outlined"
                  className={cn("w-4 h-4 ms-auto text-gray-400")}
                />
              )}
            </Link>
          );

          return <div key={item.label}>{linkContent}</div>;
        })}
      </div>
    </SlotComponent>
  );
}
