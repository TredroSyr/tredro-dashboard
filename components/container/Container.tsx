"use client";

import { cn } from "@/lib/utils";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import * as React from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";
import { HeaderRenderer } from "./components/HeaderRenderer";
import { ContainerContext } from "./context";
import type { ContainerProps, SlotData, SlotType } from "./types";

export function ContainerRoot({
  children,
  className,
  fullSize = false,
  hasPageNavbar = true,
}: ContainerProps) {
  const [slots, setSlots] = React.useState<Map<string, SlotData>>(new Map());
  const [shouldBeFullSize, setShouldBeFullSize] = React.useState(fullSize);
  const [hasHeaderList, setHasHeaderList] = React.useState(false);
  const [formInstance, setFormInstance] =
    React.useState<UseFormReturn<FieldValues> | null>(null);
  const pathname = usePathname();
  const selectedSegments = useSelectedLayoutSegments();

  const basePath = React.useMemo(() => {
    if (!pathname) return "/";
    const pathSegments = pathname.split("/").filter(Boolean);
    const hasLocalePrefix =
      pathSegments.length > 0 && /^[a-z]{2}$/i.test(pathSegments[0]);
    const segmentsWithoutLocale = hasLocalePrefix
      ? pathSegments.slice(1)
      : pathSegments;
    const segmentCount = selectedSegments?.length ?? 0;

    if (segmentCount === 0) {
      return segmentsWithoutLocale.length
        ? `/${segmentsWithoutLocale.join("/")}`
        : "/";
    }

    const trimmed = segmentsWithoutLocale.slice(
      0,
      Math.max(segmentsWithoutLocale.length - segmentCount, 0),
    );

    return trimmed.length ? `/${trimmed.join("/")}` : "/";
  }, [pathname, selectedSegments]);

  const resolveHref = React.useCallback(
    (href: string) => {
      if (!href) return basePath;
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
      const normalized = href.replace(/^\.?\//, "");
      if (normalized.length === 0) return basePath;
      return basePath === "/"
        ? `/${normalized}`
        : `${basePath.replace(/\/$/, "")}/${normalized}`;
    },
    [basePath],
  );

  const registerSlot = React.useCallback((slot: SlotData) => {
    setSlots((prev) => {
      const next = new Map(prev);
      // Always allow registration - filtering happens during rendering
      // This ensures that when hide slots are removed, normal slots are already registered
      next.set(slot.key, slot);
      return next;
    });
  }, []);

  const unregisterSlot = React.useCallback((key: string) => {
    setSlots((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // Index slots by type - single iteration through all slots
  const slotsByType = React.useMemo(() => {
    const index = new Map<SlotType, SlotData[]>();
    for (const slot of slots.values()) {
      const existing = index.get(slot.type) || [];
      index.set(slot.type, [...existing, slot]);
    }
    return index;
  }, [slots]);

  // Derive individual slots from the indexed structure
  const headerListSlot = React.useMemo(() => {
    return slotsByType.get("headerList")?.[0] || null;
  }, [slotsByType]);

  const titleSlot = React.useMemo(() => {
    return slotsByType.get("title")?.[0] || null;
  }, [slotsByType]);

  const descriptionSlot = React.useMemo(() => {
    return slotsByType.get("description")?.[0] || null;
  }, [slotsByType]);

  const actionsSlots = React.useMemo(() => {
    const allActions = slotsByType.get("actions") || [];
    // First pass: collect all keys that should be hidden (slots with null content)
    // Use originalKey if available (for hide slots), otherwise use key
    const hiddenKeys = new Set<string>();
    for (const slot of allActions) {
      if (slot.content === null) {
        // Hide slots use originalKey to indicate which key they're hiding
        const keyToHide = slot.originalKey || slot.key;
        hiddenKeys.add(keyToHide);
      }
    }
    // Second pass: filter out actions that are hidden by key
    // This filters out both the hide slots (content === null) and any slots with matching keys
    return allActions.filter((slot) => {
      if (slot.content === null) {
        // Filter out hide slots themselves
        return false;
      }
      // Check if this slot's key is in the hidden keys
      return !hiddenKeys.has(slot.key);
    });
  }, [slotsByType]);

  const contentSlot = React.useMemo(() => {
    return slotsByType.get("content")?.[0] || null;
  }, [slotsByType]);

  const toggleSlot = React.useMemo(() => {
    return slotsByType.get("toggleFormLang")?.[0] || null;
  }, [slotsByType]);

  // Breadcrumb and sidebar have special hide logic (null content overrides)
  const breadcrumbSlot = React.useMemo(() => {
    const breadcrumbs = slotsByType.get("breadcrumb") || [];
    const hidden = breadcrumbs.find((s) => s.content === null);
    if (hidden) return null;
    return breadcrumbs[breadcrumbs.length - 1] || null;
  }, [slotsByType]);

  const sidebarSlot = React.useMemo(() => {
    const sidebars = slotsByType.get("sidebar") || [];
    const hidden = sidebars.find((s) => s.content === null);
    if (hidden) return null;
    return sidebars[sidebars.length - 1] || null;
  }, [slotsByType]);

  // Update derived state based on indexed slots
  React.useEffect(() => {
    setHasHeaderList(!!headerListSlot);

    if (actionsSlots.length > 0) {
      setShouldBeFullSize(fullSize);
    } else {
      setShouldBeFullSize(true);
    }
  }, [headerListSlot, actionsSlots.length, fullSize]);

  const hasTitle = Boolean(titleSlot);
  const hasDescription = Boolean(descriptionSlot);
  const hasTitleOrDescription = hasTitle || hasDescription;
  const hasBreadcrumb = Boolean(breadcrumbSlot);
  const hasActions = actionsSlots.length > 0;
  const hasToggle = Boolean(toggleSlot);

  // Depend on booleans (stable by value), not slot object references.
  // Slot objects are replaced on every re-register, so using their references
  // here would re-create headerSlots -> contextValue -> re-render -> infinite loop.
  const headerSlots = React.useMemo(
    () => ({
      hasTitle,
      hasDescription,
      hasActions,
      hasBreadcrumb,
    }),
    [hasTitle, hasDescription, hasActions, hasBreadcrumb],
  );

  const contextValue = React.useMemo(
    () => ({
      registerSlot,
      unregisterSlot,
      fullSize: shouldBeFullSize,
      hasHeaderList,
      hasPageNavbar,
      headerSlots,
      resolveHref,
      setFormInstance: (form: UseFormReturn<FieldValues> | null) => {
        setFormInstance(form);
      },
    }),
    [
      registerSlot,
      unregisterSlot,
      shouldBeFullSize,
      hasHeaderList,
      hasPageNavbar,
      headerSlots,
      resolveHref,
    ],
  );

  return (
    <ContainerContext.Provider value={contextValue}>
      <FormProvider {...((formInstance || {}) as UseFormReturn<FieldValues>)}>
        <main
          data-slot="container"
          className={cn(
            "h-full w-full bg-transparent rounded-b-2xl overflow-hidden",
            className,
          )}
        >
          <>
            {children}

            <div className="flex flex-col w-full">
              {headerListSlot && (
                <div data-slot="container-header-list" className="w-full">
                  {headerListSlot.content}
                </div>
              )}

              <HeaderRenderer
                hasHeaderList={hasHeaderList}
                shouldBeFullSize={shouldBeFullSize}
                hasTitleOrDescription={hasTitleOrDescription}
                hasBreadcrumb={hasBreadcrumb}
                hasActions={hasActions}
                hasToggle={hasToggle}
                titleSlot={titleSlot}
                descriptionSlot={descriptionSlot}
                breadcrumbSlot={breadcrumbSlot}
                actionsSlots={actionsSlots}
                toggleSlot={toggleSlot}
              />

              <div
                className={cn(
                  "flex flex-col lg:flex-row w-full gap-3 sm:gap-4 lg:gap-6 ps-2   lg:ps-2 lg:pe-0  z-0 rounded-2xl",
                  !shouldBeFullSize &&
                    "rounded-b-2xl rounded-tr-2xl rtl:rounded-tr-none rtl:rounded-tl-2xl",
                )}
              >
                {sidebarSlot && sidebarSlot.content !== null && (
                  <aside
                    data-slot="container-content-sidebar"
                    className="w-full lg:w-auto lg:shrink-0 bg-primary/4"
                  >
                    {sidebarSlot.content}
                  </aside>
                )}

                {contentSlot && (
                  <main
                    data-slot="container-content"
                    className={cn(
                      "flex-1 min-h-0 min-w-0 w-full  rounded-b-2xl rounded-tr-2xl rtl:rounded-tr-none rtl:rounded-tl-2xl",
                      shouldBeFullSize && "rounded-t-none!",
                      !hasHeaderList &&
                        (titleSlot ||
                          descriptionSlot ||
                          hasActions ||
                          breadcrumbSlot) &&
                        "rounded-t-2xl rtl:rounded-tr-none rtl:rounded-tl-2xl",
                    )}
                  >
                    {contentSlot.renderContent
                      ? contentSlot.renderContent()
                      : contentSlot.content}
                  </main>
                )}
              </div>
            </div>
          </>
        </main>
      </FormProvider>
    </ContainerContext.Provider>
  );
}
