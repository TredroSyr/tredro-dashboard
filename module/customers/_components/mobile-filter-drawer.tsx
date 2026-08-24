"use client";
import * as React from "react";
import { Filter, X, Search } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { WORK_DAYS } from "./work-day-picker";
import { useCategoriesQuery } from "../hooks/categories";
import { useRepsQuery } from "@/module/reps/hooks";
import { Customer } from "../types";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
  count: number;
}

function FilterBadge({ count }: FilterBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="rounded-full px-1.5 font-normal h-5 flex items-center justify-center"
    >
      {count}
    </Badge>
  );
}

interface MobileFilterDrawerProps<TData extends Customer> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
}

export function MobileFilterDrawer<TData extends Customer>({
  open,
  onOpenChange,
  table,
}: MobileFilterDrawerProps<TData>) {
  const { data: categoriesRes, isLoading: isLoadingCategories } =
    useCategoriesQuery();
  const categories = categoriesRes?.data?.categories ?? [];

  // Fetch reps from API
  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const reps = repsRes?.data?.reps ?? [];

  // Local filter states
  const [nameFilter, setNameFilter] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  // For reps filter - we'll use the filter value directly from table (array of rep IDs)
  const [repsSearchQuery, setRepsSearchQuery] = React.useState("");

  // Sync with table state on open
  React.useEffect(() => {
    if (open) {
      setNameFilter((table.getColumn("name")?.getFilterValue() as string) ?? "");
      setPhoneFilter((table.getColumn("phone")?.getFilterValue() as string) ?? "");
      setEmailFilter((table.getColumn("email")?.getFilterValue() as string) ?? "");
      setRepsSearchQuery("");
    }
  }, [open, table]);

  // Reps column filter value (array of rep IDs)
  const repsColumn = table.getColumn("assigned_reps");
  const repsFilterValue = (repsColumn?.getFilterValue() as string[]) ?? [];

  // Filter reps by search query
  const filteredReps = React.useMemo(() => {
    if (!repsSearchQuery.trim()) return reps;
    const q = repsSearchQuery.toLowerCase();
    return reps.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  }, [reps, repsSearchQuery]);

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (nameFilter.trim()) count++;
    if (phoneFilter.trim()) count++;
    if (emailFilter.trim()) count++;
    if (repsFilterValue.length > 0) count += repsFilterValue.length;

    const workDaysFilter = table.getColumn("work_days")?.getFilterValue() as string[] | undefined;
    if (workDaysFilter?.length) count += workDaysFilter.length;

    const statusFilter = table.getColumn("is_active")?.getFilterValue() as string[] | undefined;
    if (statusFilter?.length) count += statusFilter.length;

    const categoryFilter = table.getColumn("category")?.getFilterValue() as string[] | undefined;
    if (categoryFilter?.length) count += categoryFilter.length;

    return count;
  }, [nameFilter, phoneFilter, emailFilter, repsFilterValue, table]);

  // Toggle rep selection
  const toggleRep = (repId: string) => {
    const isSelected = repsFilterValue.includes(repId);
    let newFilter: string[];
    if (isSelected) {
      newFilter = repsFilterValue.filter((id) => id !== repId);
    } else {
      newFilter = [...repsFilterValue, repId];
    }
    repsColumn?.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  const applyFilters = () => {
    table.getColumn("name")?.setFilterValue(nameFilter.trim() || undefined);
    table.getColumn("phone")?.setFilterValue(phoneFilter.trim() || undefined);
    table.getColumn("email")?.setFilterValue(emailFilter.trim() || undefined);
    // Reps filter is already applied via toggleRep
    onOpenChange(false);
  };

  const clearAllFilters = () => {
    setNameFilter("");
    setPhoneFilter("");
    setEmailFilter("");
    setRepsSearchQuery("");
    table.resetColumnFilters();
  };

  // Work days filter
  const workDaysColumn = table.getColumn("work_days");
  const workDaysFilter = (workDaysColumn?.getFilterValue() as string[]) ?? [];

  const toggleWorkDay = (day: string) => {
    const isSelected = workDaysFilter.includes(day);
    let newFilter: string[];
    if (isSelected) {
      newFilter = workDaysFilter.filter((d) => d !== day);
    } else {
      newFilter = [...workDaysFilter, day];
    }
    workDaysColumn?.setFilterValue(newFilter.length ? newFilter : undefined);
  };

  // Status filter
  const statusColumn = table.getColumn("is_active");
  const statusFilter = (statusColumn?.getFilterValue() as string[]) ?? [];

  const toggleStatus = (value: string) => {
    const isSelected = statusFilter.includes(value);
    let newFilter: string[];
    if (isSelected) {
      newFilter = statusFilter.filter((v) => v !== value);
    } else {
      newFilter = [...statusFilter, value];
    }
    statusColumn?.setFilterValue(newFilter.length ? newFilter : undefined);
  };

  // Category filter
  const categoryColumn = table.getColumn("category");
  const categoryFilter = (categoryColumn?.getFilterValue() as string[]) ?? [];

  const toggleCategory = (id: string) => {
    const isSelected = categoryFilter.includes(id);
    let newFilter: string[];
    if (isSelected) {
      newFilter = categoryFilter.filter((v) => v !== id);
    } else {
      newFilter = [...categoryFilter, id];
    }
    categoryColumn?.setFilterValue(newFilter.length ? newFilter : undefined);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-h-[85vh]">
        <DrawerHeader className="px-4 pb-2 pt-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="size-4" />
                <DrawerTitle className="text-base">فلترة العملاء</DrawerTitle>
                <FilterBadge count={activeFilterCount} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6 pb-16">
            {/* Text Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">بحث نصي</h3>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    الاسم
                  </Label>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث بالاسم..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="pr-8"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    رقم الهاتف
                  </Label>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث بالهاتف..."
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      className="pr-8"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث بالبريد..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="pr-8"
                      dir="ltr"
                    />
                  </div>
                </div>

              </div>
            </div>

            <Separator />

            {/* Reps Filter - Multi-select from API */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">المندوبون</h3>
              {/* Search box for reps */}
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن مندوب..."
                  value={repsSearchQuery}
                  onChange={(e) => setRepsSearchQuery(e.target.value)}
                  className="pr-8"
                />
              </div>
              {/* Reps list */}
              {isLoadingReps ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  جارِ التحميل...
                </div>
              ) : filteredReps.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {repsSearchQuery ? "لا توجد نتائج" : "لا توجد مندوبون"}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                  {filteredReps.map((rep) => {
                    const repIdStr = String(rep.id);
                    const isSelected = repsFilterValue.includes(repIdStr);
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => toggleRep(repIdStr)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:bg-accent"
                        )}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex flex-col items-start">
                          <span>{rep.name}</span>
                          <span className="text-xs opacity-70">{rep.phone}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Selected reps count */}
              {repsFilterValue.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  تم تحديد {repsFilterValue.length} مندوب
                </div>
              )}
            </div>

            <Separator />

            {/* Work Days */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">أيام الزيارة</h3>
              <div className="grid grid-cols-2 gap-2">
                {WORK_DAYS.map((day) => {
                  const isSelected = workDaysFilter.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWorkDay(day.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <span>{day.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">الحالة</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "true", label: "مفعّل" },
                  { value: "false", label: "موقوف" },
                ].map((option) => {
                  const isSelected = statusFilter.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleStatus(option.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">التصنيف</h3>
              {isLoadingCategories ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  جارِ التحميل...
                </div>
              ) : categories.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  لا توجد تصنيفات
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => {
                    const isSelected = categoryFilter.includes(String(cat.id));
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(String(cat.id))}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:bg-accent"
                        )}
                      >
                        <Checkbox checked={isSelected} />
                        <span>{cat.name}</span>
                        {cat.is_global && (
                          <Badge
                            variant="secondary"
                            className="ms-auto text-xs"
                            title="تصنيف عام للجميع"
                          >
                            افتراضي
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer buttons */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border px-4 py-3 flex gap-2 bg-background">
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="flex-1"
          >
            <X className="size-4 ms-1" />
            مسح الكل
          </Button>
          <Button
            onClick={applyFilters}
            className="flex-1"
          >
            <Search className="size-4 ms-1" />
            تطبيق
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface MobileFilterButtonProps {
  onClick: () => void;
  activeFilterCount: number;
}

export function MobileFilterButton({
  onClick,
  activeFilterCount,
}: MobileFilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-1.5"
    >
      <Filter className="size-4" />
      فلترة
      <FilterBadge count={activeFilterCount} />
    </Button>
  );
}
