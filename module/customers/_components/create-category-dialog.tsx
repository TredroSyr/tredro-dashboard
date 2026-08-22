"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCategoryMutation } from "../hooks/categories";
import { Category } from "../types/categories";

interface CreateCategoryDialogProps {
  open: boolean;
  initialName?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: Category) => void;
}

export function CreateCategoryDialog({
  open,
  initialName = "",
  onOpenChange,
  onCreated,
}: CreateCategoryDialogProps) {
  const [name, setName] = React.useState(initialName);
  const {
    mutate: createCategory,
    isPending,
    error,
  } = useCreateCategoryMutation();

  React.useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createCategory(
      { name: trimmed },
      {
        onSuccess: (res) => {
          onCreated(res.data.category);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة تصنيف جديد</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم التصنيف"
            className="text-right h-11"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {error && (
            <span className="text-xs text-destructive text-right">
              {(error as any)?.response?.data?.message ?? "تعذّر إنشاء التصنيف"}
            </span>
          )}
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            حفظ
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
