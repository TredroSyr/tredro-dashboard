"use client";

import { useRef } from "react";
import { Upload, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";

export const ProductImagesTab = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "images",
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file, i) => {
      append({
        _localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        alt_text: "",
        is_primary: fields.length === 0 && i === 0,
      });
    });
  };

  // NOTE: `field` here always contains an `id` injected by RHF itself
  // (its internal row key), which is a string and is NOT the same as
  // your schema's optional numeric `id`. Spreading it back via `update()`
  // silently clobbers your real id and breaks zod validation
  // ("Expected number, received string"). Strip it before spreading.
  const setPrimary = (index: number) => {
    fields.forEach((field, i) => {
      const { id: _rhfId, ...rest } = field;
      update(i, { ...rest, is_primary: i === index });
    });
  };

  const setAltText = (index: number, alt_text: string) => {
    const { id: _rhfId, ...rest } = fields[index];
    update(index, { ...rest, alt_text });
  };

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="h-24 border-dashed flex-col gap-2"
      >
        <Upload className="size-5" />
        اضغط لرفع الصور
      </Button>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          سيتم رفع الصور بعد حفظ المنتج مباشرة
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative rounded-md border border-border overflow-hidden flex flex-col"
            >
              <img
                src={field.previewUrl}
                alt=""
                className="w-full h-28 object-cover"
              />
              <div className="p-2 flex flex-col gap-2">
                <Input
                  value={field.alt_text}
                  onChange={(e) => setAltText(index, e.target.value)}
                  placeholder="وصف الصورة"
                  className="h-8 text-xs text-right"
                />
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant={field.is_primary ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrimary(index)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Star className="size-3" />
                    {field.is_primary ? "رئيسية" : "تعيين كرئيسية"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
