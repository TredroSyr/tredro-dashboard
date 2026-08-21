"use client";
import * as React from "react";
import { Loader2, UserPlus, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineSelectPopover } from "./inline-select-popover";
import { useRepsQuery } from "@/module/reps/hooks";
import {
  useAssignRepsMutation,
  useUpdateCustomerMutation,
  useCustomersQuery,
} from "../hooks";
import { Customer } from "../types";

interface BulkAssignBarProps {
  selectedCustomers: Customer[];
  clearSelection: () => void;
}

export function BulkAssignBar({
  selectedCustomers,
  clearSelection,
}: BulkAssignBarProps) {
  const [isAssigningRep, setIsAssigningRep] = React.useState(false);
  const [isAssigningCategory, setIsAssigningCategory] = React.useState(false);

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const { data: customersRes } = useCustomersQuery();
  const { mutateAsync: assignReps } = useAssignRepsMutation();
  const { mutateAsync: updateCustomer } = useUpdateCustomerMutation();

  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    (customersRes?.data?.customers ?? []).forEach((c) => {
      if (c.category?.trim()) set.add(c.category.trim());
    });
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [customersRes]);

  const handleAssignRep = async (repId: string) => {
    setIsAssigningRep(true);
    try {
      await Promise.all(
        selectedCustomers.map((c) =>
          assignReps({ id: c.id, rep_ids: [Number(repId)] }),
        ),
      );
      clearSelection();
    } finally {
      setIsAssigningRep(false);
    }
  };

  const handleAssignCategory = async (category: string) => {
    setIsAssigningCategory(true);
    try {
      await Promise.all(
        selectedCustomers.map((c) => updateCustomer({ id: c.id, category })),
      );
      clearSelection();
    } finally {
      setIsAssigningCategory(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 shrink-0">
        <Badge>{selectedCustomers.length} عميل محدد</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSelection}
        >
          إلغاء التحديد
        </Button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2">
        <InlineSelectPopover
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAssigningRep}
              className="justify-start w-full sm:w-auto"
            >
              {isAssigningRep ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              تعيين مندوب للمحدد
            </Button>
          }
          options={repOptions}
          onSelect={handleAssignRep}
          loading={isLoadingReps}
          searchPlaceholder="ابحث عن مندوب..."
          emptyText="لا يوجد مندوبون"
        />

        <InlineSelectPopover
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAssigningCategory}
              className="justify-start w-full sm:w-auto"
            >
              {isAssigningCategory ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Tag className="size-4" />
              )}
              تعيين تصنيف للمحدد
            </Button>
          }
          options={categoryOptions}
          onSelect={handleAssignCategory}
          allowCreate
          searchPlaceholder="ابحث أو أضف تصنيفاً..."
          emptyText="لا توجد تصنيفات بعد"
          createLabel={(q) => `إضافة تصنيف "${q}"`}
        />
      </div>
    </div>
  );
}
