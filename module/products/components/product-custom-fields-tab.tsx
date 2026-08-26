"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { useCustomFieldDefinitionsQuery } from "../hook";
import { CustomFieldCreateDialog } from "./custom-field-create-dialog";

export const ProductCustomFieldsTab = () => {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const { data: defsRes, isLoading } = useCustomFieldDefinitionsQuery();
  const definitions = defsRes?.data?.definitions ?? [];

  const customFields = watch("custom_fields");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const usedKeys = Object.keys(customFields);
  const availableOptions = definitions
    .filter((d) => !usedKeys.includes(d.key))
    .map((d) => ({ value: d.key, label: d.label }));

  const addField = () => {
    if (!selectedKey) return;
    setValue("custom_fields", { ...customFields, [selectedKey]: "" });
    setSelectedKey("");
  };

  const removeField = (key: string) => {
    const next = { ...customFields };
    delete next[key];
    setValue("custom_fields", next);
  };

  const setFieldValue = (key: string, value: string) => {
    setValue("custom_fields", { ...customFields, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label className="text-right block">إضافة حقل مخصص</Label>
          <SearchableSelect
            options={availableOptions}
            value={selectedKey}
            onChange={setSelectedKey}
            placeholder="اختر حقلاً"
            loading={isLoading}
            onCreateNew={() => setDialogOpen(true)}
            createNewLabel="إضافة حقل"
          />
        </div>
        <Button
          type="button"
          onClick={addField}
          disabled={!selectedKey}
          className="h-12"
        >
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>

      {usedKeys.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          لا توجد حقول مخصصة مضافة بعد
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {usedKeys.map((key) => {
            const def = definitions.find((d) => d.key === key);
            return (
              <div key={key} className="flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-2">
                  <Label className="text-right block">
                    {def?.label ?? key}
                  </Label>
                  <Input
                    value={customFields[key]}
                    onChange={(e) => setFieldValue(key, e.target.value)}
                    className="h-12 text-right"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(key)}
                  className="h-12 w-12"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <CustomFieldCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(definition) => {
          setValue("custom_fields", {
            ...customFields,
            [definition.key]: "",
          });
        }}
      />
    </div>
  );
};
