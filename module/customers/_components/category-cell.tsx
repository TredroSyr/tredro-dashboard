"use client";
import * as React from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryPickerPopover } from "./category-picker-popover";
import { Customer } from "../types";
import { useUpdateCustomerMutation } from "../hooks";

export function CategoryCell({ customer }: { customer: Customer }) {
  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  const handleChange = (categoryId: string) => {
    updateCustomer({ id: customer.id, category: Number(categoryId) });
  };

  return (
    <CategoryPickerPopover
      value={
        customer.category_details ? String(customer.category_details.id) : ""
      }
      onSelect={handleChange}
      trigger={
        <button
          type="button"
          disabled={isPending}
          className="disabled:opacity-50"
        >
          {customer.category_details ? (
            <Badge
              variant="outline"
              className="font-normal cursor-pointer hover:bg-accent"
            >
              {customer.category_details.name}
            </Badge>
          ) : (
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground hover:text-foreground cursor-pointer">
              <Tag className="size-3.5" />
              إضافة تصنيف
            </span>
          )}
        </button>
      }
    />
  );
}
