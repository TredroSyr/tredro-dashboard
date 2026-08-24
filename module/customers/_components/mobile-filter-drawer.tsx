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
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { WORK_DAYS } from "./work-day-picker";
import { useCategoriesQuery } from "../hooks/categories";
import { useRepsQuery } from "@/module/reps/hooks";
import { Customer } from "../types";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/tredro/searchable-select";

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

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const reps = repsRes?.data?.reps ?? [];

  const repOptions = React.useMemo(
    () => reps.map((r) => ({ value: String(r.id), label: r.name })),
    [reps],
  );

  const categoryOptions = React.useMemo(
    () =>
      categories.map((c) => ({
        value: String(c.id),
        label: c.is_global ? `${c.name} (افتراضي)` : c.name,
      })),
    [categories],
  );

  // Local filter states
  const [nameFilter, setNameFilter] = React.useState("");
  const [phoneFilter, setPhoneFilter] = React.useState("");
  const [emailFilter, setEmailFilter] = React.useState("");
  const [repPicker, setRepPicker] = React.useState("");
  const [categoryPicker, setCategoryPicker] = React.useState("");
  const [selectedRepIds, setSelectedRepIds] = React.useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>(
    [],
  );
  const [selectedWorkDays, setSelectedWorkDays] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);

  // Sync with table state on open
  React.useEffect(() => {
    if (open) {
      setNameFilter((table.getColumn("name")?.getFilterValue() as string) ?? "");
      setPhoneFilter((table.getColumn("phone")?.getFilterValue() as string) ?? "");
      setEmailFilter((table.getColumn("email")?.getFilterValue() as string) ?? "");
      setSelectedRepIds(
        (table.getColumn("assigned_reps")?.getFilterValue() as string[]) ?? [],
      );
      setSelectedCategoryIds(
        (table.getColumn("category")?.getFilterValue() as string[]) ?? [],
      );
      setSelectedWorkDays(
        (table.getColumn("work_days")?.getFilterValue() as string[]) ?? [],
      );
      setSelectedStatus(
        (table.getColumn("is_active")?.getFilterValue() as string[]) ?? [],
      );
      setRepPicker("");
      setCategoryPicker("");
    }
  }, [open, table]);

  const selectedReps = selectedRepIds
    .map((id) => repOptions.find((o) => o.value === id))
    .filter(Boolean) as { value: string; label: string }[];

  const availableRepOptions = repOptions.filter(
    (o) => !selectedRepIds.includes(o.value),
  );

  const addRep = (repId: string) => {
    setSelectedRepIds((prev) => [...prev, repId]);
    setRepPicker("");
  };

  const removeRep = (repId: string) => {
    setSelectedRepIds((prev) => prev.filter((id) => id !== repId));
  };

  const selectedCategories = selectedCategoryIds
    .map((id) => categoryOptions.find((o) => o.value === id))
    .filter(Boolean) as { value: string; label: string }[];

  const availableCategoryOptions = categoryOptions.filter(
    (o) => !selectedCategoryIds.includes(o.value),
  );

  const addCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => [...prev, catId]);
    setCategoryPicker("");
  };

  const removeCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId));
  };

  // Work days filter (local state, applied on "تطبيق")
  const toggleWorkDay = (day: string) => {
    setSelectedWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // Status filter (local state, applied on "تطبيق")
  const toggleStatus = (value: string) => {
    setSelectedStatus((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  // Calculate active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (nameFilter.trim()) count++;
    if (phoneFilter.trim()) count++;
    if (emailFilter.trim()) count++;
    count += selectedRepIds.length;
    count += selectedCategoryIds.length;
    count += selectedWorkDays.length;
    count += selectedStatus.length;

    return count;
  }, [
    nameFilter,
    phoneFilter,
    emailFilter,
    selectedRepIds,
    selectedCategoryIds,
    selectedWorkDays,
    selectedStatus,
  ]);

  const applyFilters = () => {
    table.getColumn("name")?.setFilterValue(nameFilter.trim() || undefined);
    table.getColumn("phone")?.setFilterValue(phoneFilter.trim() || undefined);
    table.getColumn("email")?.setFilterValue(emailFilter.trim() || undefined);
    table
      .getColumn("assigned_reps")
      ?.setFilterValue(selectedRepIds.length ? selectedRepIds : undefined);
    table
      .getColumn("category")
      ?.setFilterValue(
        selectedCategoryIds.length ? selectedCategoryIds : undefined,
      );
    table
      .getColumn("work_days")
      ?.setFilterValue(selectedWorkDays.length ? selectedWorkDays : undefined);
    table
      .getColumn("is_active")
      ?.setFilterValue(selectedStatus.length ? selectedStatus : undefined);
    onOpenChange(false);
  };

  const clearAllFilters = () => {
    setNameFilter("");
    setPhoneFilter("");
    setEmailFilter("");
    setRepPicker("");
    setCategoryPicker("");
    setSelectedRepIds([]);
    setSelectedCategoryIds([]);
    setSelectedWorkDays([]);
    setSelectedStatus([]);
    table.resetColumnFilters();
  };

  return (
    <Drawer swipeDirection="down" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="
          flex flex-col
          w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl
          sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none
          md:max-w-xl
          lg:max-w-3xl
        "
      >
        <DrawerHeader
          className="
            flex-row items-center justify-between gap-3
            px-4 pt-6 pb-3
            sm:px-6 sm:pt-4
            sticky top-0 z-10 bg-background border-b border-border
          "
        >
          <div className="flex items-center gap-2">
            <Filter className="size-4" />
            <DrawerTitle className="text-right text-base sm:text-lg">
              فلترة العملاء
            </DrawerTitle>
            <FilterBadge count={activeFilterCount} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={applyFilters} size="sm">
              <Search className="size-4 ms-1" />
              تطبيق
            </Button>
            <DrawerClose>
              <Button variant="outline" type="button" size="sm">
                إغلاق
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div
          className="
            flex flex-col gap-4
            overflow-y-auto flex-1 min-h-0
            px-4 py-4 pb-8
            sm:px-6 sm:pb-6
          "
        >
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
                    className="pr-8 h-12"
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
                    className="pr-8 h-12"
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
                    className="pr-8 h-12"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reps Filter - same SearchableSelect as CustomerFormDrawer */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">المندوبون</h3>
            <SearchableSelect
              options={availableRepOptions}
              value={repPicker}
              onChange={addRep}
              loading={isLoadingReps}
              placeholder="اختر مندوباً لإضافته"
              searchPlaceholder="ابحث عن مندوب..."
              emptyText={
                availableRepOptions.length
                  ? "لا توجد نتائج"
                  : "تمت إضافة جميع المندوبين"
              }
            />

            {selectedReps.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedReps.map((rep) => (
                  <Badge
                    key={rep.value}
                    variant="secondary"
                    className="gap-1 pr-1 font-normal"
                  >
                    {rep.label}
                    <button
                      type="button"
                      onClick={() => removeRep(rep.value)}
                      className="rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Work Days */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">أيام الزيارة</h3>
            <div className="grid grid-cols-2 gap-2">
              {WORK_DAYS.map((day) => {
                const isSelected = selectedWorkDays.includes(day.value);
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
                const isSelected = selectedStatus.includes(option.value);
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

          {/* Categories Filter - same SearchableSelect as reps */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">التصنيف</h3>
            <SearchableSelect
              options={availableCategoryOptions}
              value={categoryPicker}
              onChange={addCategory}
              loading={isLoadingCategories}
              placeholder="اختر تصنيفاً لإضافته"
              searchPlaceholder="ابحث عن تصنيف..."
              emptyText={
                availableCategoryOptions.length
                  ? "لا توجد نتائج"
                  : "تمت إضافة جميع التصنيفات"
              }
            />

            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedCategories.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant="secondary"
                    className="gap-1 pr-1 font-normal"
                  >
                    {cat.label}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.value)}
                      className="rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <Filter className="size-4" />
      فلترة
      <FilterBadge count={activeFilterCount} />
    </Button>
  );
}