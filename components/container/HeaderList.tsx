"use client";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { ChevronRight } from "lucide-react";
import ReactDOM from "react-dom";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import * as React from "react";
import type {
  HeaderDropdownProps,
  HeaderLinkProps,
  HeaderLinksProps,
  HeaderListProps,
} from "./types";
import { SlotComponent } from "./SlotComponent";
import { useContainerContext } from "./context";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "../ui/badge";

/**
 * HeaderList - Top navigation tabs container
 * Wraps header navigation links and dropdowns
 */

/**
 * HeaderList - Top navigation tabs container
 * Wraps header navigation links and dropdowns
 */
export function HeaderList({ children, className }: HeaderListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const setScrollRef = (node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    if (node) {
      checkScroll();
    }
  };

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollTo({
        left:
          scrollContainerRef.current.scrollLeft +
          (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  return (
    <SlotComponent slotType="headerList" className={className}>
      <div className="relative">
        {showLeftArrow && (
          <IconRenderer
            name="double_arrows_left_filled"
            onClick={() => scroll("left")}
            className="w-8 h-8 cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 z-5 bg-primary text-white shadow-md rounded-full p-2 transition-colors"
            aria-label="Scroll left"
          />
        )}

        <div
          ref={setScrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            data-slot="container-header-list"
            className={cn(
              "bg-alpha-white-50 ps-4 flex items-center w-fit rounded-t-2xl relative gap-4",
            )}
          >
            <div className="absolute end-[-18px] top-[2px] z-0 rtl:end-[-22px] rtl:scale-x-[-1]">
              <IconRenderer
                name="curve_2"
                className="h-[43px] w-[32px] fill-alpha-white-50"
              />
            </div>
            <div className="absolute start-0 top-full z-20 h-3 w-3 bg-alpha-white-50" />
            {children}
          </div>
        </div>

        {showRightArrow && (
          <IconRenderer
            name="double_arrows_right_filled"
            onClick={() => scroll("right")}
            className="w-8 h-8 cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-white shadow-md rounded-full p-2 transition-colors"
            aria-label="Scroll right"
          />
        )}
      </div>
    </SlotComponent>
  );
}

/**
 * HeaderLink - Individual navigation link in header list
 * Supports active state detection and icon rendering
 */
export function HeaderLink({
  label,
  href,
  icon,
  exact = false,
  permission,
  ...props
}: HeaderLinkProps) {
  const pathname = usePathname();
  console.log("SSSSSSSS", permission);
  const { resolveHref } = useContainerContext();
  const targetHref = resolveHref(href);
  const normalizedPath = pathname.replace(/^\/(en|ar)/, "");
  const normalizedHref = targetHref.replace(/^\/(en|ar)/, "");
  let isActive: boolean;

  if (exact) {
    const startsWithHref = normalizedPath === normalizedHref;
    const nextSegment =
      normalizedPath.slice(normalizedHref.length + 1).split("/")[0] || "";
    const startsWithHrefAndId =
      normalizedPath.startsWith(`${normalizedHref}/`) &&
      /^\d+$/.test(nextSegment);
    const startsWithHrefAndNewOrCreate =
      normalizedPath.startsWith(`${normalizedHref}/`) &&
      (nextSegment === "new" || nextSegment === "create");

    isActive =
      startsWithHref || startsWithHrefAndId || startsWithHrefAndNewOrCreate;
  } else {
    isActive = normalizedPath.startsWith(normalizedHref);
  }

  const { popover: _, ...linkProps } = props as {
    popover?: string;
    [key: string]: unknown;
  };

  const linkContent = (
    <Link
      href={targetHref}
      {...linkProps}
      data-active={isActive}
      className={cn(
        "text-sm font-medium px-6 py-3 relative flex items-center gap-2 rounded-t-lg transition-all cursor-pointer group",
        isActive ? "bg-primary/4" : "text-fg-tertiary",
      )}
    >
      {icon && (
        <IconRenderer
          name={icon}
          className={cn(
            isActive
              ? "text-fg-brand-primary"
              : "text-fg-tertiary group-hover:text-fg-brand-primary",
            "w-4 h-4",
          )}
        />
      )}
      <span
        className={cn(
          isActive
            ? "text-fg-brand-primary-alt"
            : "text-fg-tertiary group-hover:text-fg-brand-primary",
        )}
      >
        {label}
      </span>
      <FolderStyle fillClassName={isActive ? "fill-bg-primary" : ""} />
    </Link>
  );

  if (permission) {
    return { linkContent };
  }

  return linkContent;
}

/**
 * HeaderLinks - Renders multiple HeaderLink components from an array
 */
export function HeaderLinks({ items }: HeaderLinksProps) {
  return (
    <>
      {items.map((item) => (
        <HeaderLink
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          exact={item.exact}
          permission={item.permission}
        />
      ))}
    </>
  );
}

/**
 * HeaderDropdown - Dropdown menu in header list
 * Uses NavigationMenu component for dropdown functionality
 */
export function HeaderDropdown({
  label,
  links = [],
  ...props
}: HeaderDropdownProps) {
  const { resolveHref } = useContainerContext();

  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  }>({
    top: 0,
  });

  const isRTL =
    typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (isRTL) {
        setPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      } else {
        setPosition({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setIsOpen(true);
  };

  const close = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 100);
  };

  if (!links || links.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2",
          "text-sm font-medium px-4 py-2 relative rounded-t-lg transition-all bg-transparent cursor-pointer min-h-[40px]",
        )}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        className={cn(
          "group inline-flex h-8 items-center justify-center gap-1",
          "bg-primary px-3 py-1 rounded-full text-fg-white",
          "text-sm font-medium transition-all cursor-pointer",
          "hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {label}
        <ChevronRight
          className={cn(
            "relative size-3 transition-transform duration-300",
            "rtl:rotate-180",
            isOpen ? "rotate-90 rtl:rotate-90" : "",
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              right: position.right,
            }}
            className="z-[9999]"
            onMouseEnter={open}
            onMouseLeave={close}
          >
            <div
              className={cn(
                "bg-primary/4-alt rounded-[16px] shadow-md animate-in fade-in-0 zoom-in-95",
              )}
            >
              <ul
                className={cn("flex flex-col gap-1 w-[294px] rtl:text-end")}
                {...props}
              >
                {links.map(
                  (
                    {
                      label: optionLabel,
                      icon,
                      href,
                      status,
                      permission: linkPermission,
                    },
                    index,
                  ) => {
                    const linkContent = (
                      <Link
                        href={resolveHref(href)}
                        className={cn(
                          "group flex items-center gap-2 h-10 rounded-md px-2 py-1.5 cursor-pointer border border-transparent transition-all duration-200",
                          "text-fg-tertiary hover:text-fg-brand-primary hover:bg-accent/50",
                          "dark:text-fg-tertiary dark:hover:text-fg-brand-primary dark:hover:bg-accent/30",
                        )}
                      >
                        {icon && typeof icon === "string" && (
                          <IconRenderer
                            name={icon}
                            className="w-4 h-4 shrink-0 text-fg-tertiary group-hover:text-fg-brand-primary transition-colors"
                          />
                        )}
                        <p className="text-sm font-medium">{optionLabel}</p>
                        {status && (
                          <Badge className="ms-auto px-1.5 py-0.5 text-[10px] font-semibold lowercase rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                            {status}
                          </Badge>
                        )}
                      </Link>
                    );

                    return <li key={index}>{linkContent}</li>;
                  },
                )}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * FolderStyle - Decorative curve icons for header links
 * Provides visual styling for active/inactive states
 */
function FolderStyle({ fillClassName }: { fillClassName?: string }) {
  return (
    <>
      <div className="absolute bottom-0 rtl:scale-x-[-1] start-[93%]">
        <IconRenderer
          name="curve_2"
          className={cn("h-[40px] w-[30px]", fillClassName)}
        />
      </div>
      <div className="absolute bottom-0 rtl:scale-x-[1] end-[93%] scale-x-[-1]">
        <IconRenderer
          name="curve_2"
          className={cn("h-[40px] w-[30px]", fillClassName)}
        />
      </div>
    </>
  );
}
