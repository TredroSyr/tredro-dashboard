"use client";
import * as React from "react";
import { InlineSelectPopover, InlineOption } from "./inline-select-popover";
import { CreateCategoryDialog } from "./create-category-dialog";
import { useCategoriesQuery } from "../hooks/categories";
import { Category } from "../types/categories";

interface CategoryPickerPopoverProps {
  trigger: React.ReactNode;
  value?: string;
  onSelect: (categoryId: string) => void;
  align?: "start" | "center" | "end";
}

export function CategoryPickerPopover({
  trigger,
  value,
  onSelect,
  align = "start",
}: CategoryPickerPopoverProps) {
  const { data: categoriesRes, isLoading } = useCategoriesQuery();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingQuery, setPendingQuery] = React.useState("");

  const categories = categoriesRes?.data?.categories ?? [];

  const options: InlineOption[] = React.useMemo(
    () =>
      categories.map((c) => ({
        value: String(c.id),
        label: c.is_global ? `${c.name} (افتراضي)` : c.name,
      })),
    [categories],
  );

  const currentLabel =
    categories.find((c) => String(c.id) === value)?.name ?? "";

  return (
    <>
      <InlineSelectPopover
        trigger={trigger}
        options={options}
        value={value}
        initialQuery={currentLabel}
        onSelect={onSelect}
        loading={isLoading}
        allowCreate
        align={align}
        searchPlaceholder="ابحث عن تصنيف..."
        emptyText="لا توجد تصنيفات"
        createLabel={(q) => `إضافة تصنيف "${q}"`}
        onCreateRequest={(q) => {
          setPendingQuery(q);
          setCreateOpen(true);
        }}
        showCreateButton
        createButtonLabel="إضافة تصنيف جديد"
        onCreateButtonClick={() => {
          setPendingQuery("");
          setCreateOpen(true);
        }}
      />

      <CreateCategoryDialog
        open={createOpen}
        initialName={pendingQuery}
        onOpenChange={setCreateOpen}
        onCreated={(category: Category) => onSelect(String(category.id))}
      />
    </>
  );
}
