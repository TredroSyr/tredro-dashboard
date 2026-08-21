"use client";
import * as React from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InlineSelectPopover } from "./inline-select-popover";
import { Customer } from "../types";
import { useCustomersQuery, useUpdateCustomerMutation } from "../hooks";

export function CategoryCell({ customer }: { customer: Customer }) {
  const { data: customersRes } = useCustomersQuery();
  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    (customersRes?.data?.customers ?? []).forEach((c) => {
      if (c.category?.trim()) set.add(c.category.trim());
    });
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [customersRes]);

  const handleSelect = (category: string) => {
    if (category === customer.category) return;
    updateCustomer({ id: customer.id, category });
  };

  return (
    <InlineSelectPopover
      trigger={
        <button
          type="button"
          disabled={isPending}
          className="disabled:opacity-50"
        >
          {customer.category ? (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-accent"
            >
              {customer.category}
            </Badge>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Tag className="size-3.5" />
              إضافة تصنيف
            </span>
          )}
        </button>
      }
      options={categoryOptions}
      value={customer.category ?? undefined}
      onSelect={handleSelect}
      allowCreate
      searchPlaceholder="ابحث أو أضف تصنيفاً..."
      emptyText="لا توجد تصنيفات بعد"
      createLabel={(q) => `إضافة تصنيف "${q}"`}
    />
  );
}
