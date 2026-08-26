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
import { CustomFieldDefinition } from "../types";
import { useCreateCustomFieldDefinitionMutation } from "../hook";

interface CustomFieldCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (definition: CustomFieldDefinition) => void;
}

export const CustomFieldCreateDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CustomFieldCreateDialogProps) => {
  const [key, setKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const { mutateAsync, isPending } = useCreateCustomFieldDefinitionMutation();

  React.useEffect(() => {
    if (!open) {
      setKey("");
      setLabel("");
      setIsActive(true);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!key.trim() || !label.trim()) {
      setError("المفتاح والعنوان مطلوبان");
      return;
    }
    setError(null);
    try {
      const res = await mutateAsync({
        key: key.trim(),
        label: label.trim(),
        is_active: isActive,
      });
      onCreated(res.data.definition);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الحقل",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة حقل مخصص جديد</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-right block">العنوان</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: اللون"
              className="text-right h-12"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-right block">المفتاح</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="color"
              dir="ltr"
              className="h-12"
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
