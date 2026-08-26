"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { ProductCategory } from "../types";
import { useCategoriesQuery, useCreateCategoryMutation } from "../hook";

interface CategoryCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: ProductCategory) => void;
}

export const CategoryCreateDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CategoryCreateDialogProps) => {
  const [name, setName] = React.useState("");
  const [parent, setParent] = React.useState<string | undefined>(undefined);
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { data: categoriesRes, isLoading: loadingCategories } =
    useCategoriesQuery();
  const categories = categoriesRes?.data?.categories ?? [];
  const parentOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const { mutateAsync, isPending } = useCreateCategoryMutation();

  React.useEffect(() => {
    if (!open) {
      setName("");
      setParent(undefined);
      setIsActive(true);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("اسم التصنيف مطلوب");
      return;
    }
    setError(null);
    try {
      const res = await mutateAsync({
        name: name.trim(),
        parent: parent ? Number(parent) : null,
        is_active: isActive,
      });
      onCreated(res.data.category);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء التصنيف",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة تصنيف جديد</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-right block">اسم التصنيف</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: هواتف ذكية"
              className="text-right h-12"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-right block">التصنيف الأب (اختياري)</Label>
            <SearchableSelect
              options={parentOptions}
              value={parent}
              onChange={setParent}
              placeholder="اختر التصنيف الأب"
              loading={loadingCategories}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-right block">مفعل</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && (
            <p className="text-xs text-destructive text-right">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
