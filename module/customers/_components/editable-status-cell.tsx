"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Customer } from "../types";
import { useUpdateCustomerMutation } from "../hooks";

export function EditableStatusCell({ customer }: { customer: Customer }) {
  const { mutate: updateCustomer, isPending } = useUpdateCustomerMutation();

  const handleChange = (value: string) => {
    const isActive = value === "true";
    if (isActive === customer.is_active) return;
    updateCustomer({ id: customer.id, is_active: isActive });
  };

  return (
    <Select
      value={String(customer.is_active)}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-[110px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:opacity-50">
        <SelectValue asChild>
          <span className="flex items-center gap-1.5">
            {isPending && (
              <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
            )}
            <Badge
              variant={customer.is_active ? "default" : "destructive"}
              className="font-normal cursor-pointer"
            >
              {customer.is_active ? "مفعّل" : "موقوف"}
            </Badge>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="true">
          <span className="text-sm font-normal">مفعّل</span>
        </SelectItem>
        <SelectItem value="false">
          <span className="text-sm font-normal">موقوف</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
