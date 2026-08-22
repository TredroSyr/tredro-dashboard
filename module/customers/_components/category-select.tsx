"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  SearchableSelectOption,
} from "@/components/tredro/searchable-select";
import { CreateCategoryDialog } from "./create-category-dialog";
import { useCategoriesQuery } from "../hooks/categories";
import { Category } from "../types/categories";

interface CategorySelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onChange,
  disabled,
  className,
  placeholder = "اختر تصنيفاً",
}: CategorySelectProps) {
  const { data: categoriesRes, isLoading } = useCategoriesQuery();
  const [createOpen, setCreateOpen] = React.useState(false);

  const categories = categoriesRes?.data?.categories ?? [];

  const options: SearchableSelectOption[] = React.useMemo(
    () => [
      ...categories.map((c) => ({
        value: String(c.id),
        label: c.is_global ? `${c.name} (افتراضي)` : c.name,
      })),
      { value: "__create_new__", label: "+ إضافة تصنيف جديد" },
    ],
    [categories],
  );

  const handleChange = (v: string) => {
    if (v === "__create_new__") {
      setCreateOpen(true);
      return;
    }
    onChange(v);
  };

  return (
    <>
      <SearchableSelect
        options={options}
        value={value}
        onChange={handleChange}
        loading={isLoading}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        searchPlaceholder="ابحث عن تصنيف..."
        emptyText="لا توجد تصنيفات"
      />

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(category: Category) => {
          onChange(String(category.id));
        }}
      />
    </>
  );
}
