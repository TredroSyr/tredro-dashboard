"use client";

import { ChevronRightIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { BreadcrumbProps } from "./types";
import { SlotComponent } from "./SlotComponent";

import { Skeleton } from "@/components/ui/skeleton";
import { ContainerContext } from "./context";
import Link from "next/link";

export function Breadcrumb({
  path,
  pageName,
  hide = false,
  showTranslation = true,
  isLoading = false,
  invalidSegments = [
    "site",
    "design",
    "blog",
    "edit-adventure",
    "desgin",
    "products",
    "contacts",
    "billing&subscriptions",
    "people&permissions",
    "configration",
    "sales",
  ],
  ...props
}: BreadcrumbProps) {
  const context = React.useContext(ContainerContext);
  const isInsideContainer = Boolean(context);

  const pathname = usePathname();
  const pathnames = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => !["ar", "en"].includes(segment));

  if (hide) return null;

  const hasCustomPath = Boolean(path?.length);

  let breadcrumbContent: React.ReactNode = null;

  if (hasCustomPath && path) {
    breadcrumbContent = (
      <nav className="flex items-center gap-2" {...props}>
        {path.map((item, index) => (
          <div key={item.href} className="flex items-center gap-2 text-[12px]">
            {index === path.length - 1 ? (
              <span className="text-primary">{item.label}</span>
            ) : (
              <Link className="text-gray-400" href={item.href}>
                {item.label}
              </Link>
            )}
            {index !== path.length - 1 && (
              <ChevronRightIcon className="rtl:rotate-180 w-4 h-4 text-gray-300" />
            )}
          </div>
        ))}
      </nav>
    );
  } else {
    const pagNameCopy = Array.isArray(pageName) ? [...pageName] : [];

    const breadcrumb = pathnames
      .map((name, index) => {
        const isLastSegment = index === pathnames.length - 1;
        const isFirstSegment = index === 0;

        const baseRoute = `/${pathnames.slice(0, index + 1).join("/")}`;
        const route =
          isFirstSegment && name === "expert" ? "/expert/dashboard" : baseRoute;

        const isNumberOrId = /^\d+$/.test(name) || /^[a-f0-9-]{36}$/.test(name);

        let displayName = name;
        if (isNumberOrId && pageName) {
          displayName =
            typeof pageName === "string"
              ? pageName
              : (pagNameCopy.shift() ?? "");
        }

        const isInvalid = invalidSegments.includes(name);
        const isClickable =
          !isInvalid && (!isFirstSegment || name === "expert");

        if (!isClickable) return null;

        return (
          <div key={route} className="flex items-center gap-2 text-[12px]">
            <Link
              className={`$${
                isLastSegment
                  ? "text-primary"
                  : isNumberOrId
                    ? "text-gray-400 pointer-events-none cursor-default"
                    : "text-gray-400 hover:text-primary"
              }`}
              href={route}
            >
              {isNumberOrId ? (
                isLoading ? (
                  <Skeleton className="h-3 w-24" />
                ) : showTranslation ? (
                  displayName
                ) : (
                  displayName
                )
              ) : (
                displayName
              )}
            </Link>
            {!isLastSegment && (
              <ChevronRightIcon className="rtl:rotate-180 w-4 h-4 text-gray-300" />
            )}
          </div>
        );
      })
      .filter(Boolean);

    breadcrumbContent = (
      <nav className="flex items-center gap-2" {...props}>
        {breadcrumb}
      </nav>
    );
  }

  // When inside a Container, use the slot system so it renders in the correct layout slot.
  // When used standalone (e.g. in the old Header component), render directly.
  if (isInsideContainer) {
    return (
      <SlotComponent slotType="breadcrumb">{breadcrumbContent}</SlotComponent>
    );
  }

  return <>{breadcrumbContent}</>;
}
