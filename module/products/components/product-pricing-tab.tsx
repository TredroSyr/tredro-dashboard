"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { useCurrenciesQuery } from "../hook";

export const ProductPricingTab = () => {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "prices",
  });

  const { data: currenciesRes } = useCurrenciesQuery();
  const currencies = currenciesRes?.data?.currencies ?? [];
  const currencyOptions = currencies.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.symbol})`,
  }));

  const [draftCurrency, setDraftCurrency] = useState<string>("");
  const [draftPrice, setDraftPrice] = useState<string>("");
  const [draftIsDefault, setDraftIsDefault] = useState(fields.length === 0);

  const addPrice = () => {
    if (!draftCurrency || !draftPrice) return;
    const currency = currencies.find((c) => String(c.id) === draftCurrency);

    if (draftIsDefault) {
      fields.forEach((field, i) => {
        if (field.is_default) update(i, { ...field, is_default: false });
      });
    }

    append({
      _localId: crypto.randomUUID(),
      currency: Number(draftCurrency),
      currency_code: currency?.code,
      currency_symbol: currency?.symbol,
      price_type: "standard",
      customer_category: null,
      price: draftPrice,
      is_default: draftIsDefault,
    });

    setDraftCurrency("");
    setDraftPrice("");
    setDraftIsDefault(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-border p-4 flex flex-col gap-4">
        <p className="text-sm font-medium text-right">إضافة سعر</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-right block">العملة</Label>
            <SearchableSelect
              options={currencyOptions}
              value={draftCurrency}
              onChange={setDraftCurrency}
              placeholder="اختر العملة"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-right block">السعر</Label>
            <Input
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              placeholder="1500.00"
              dir="ltr"
              className="h-12"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label>السعر الافتراضي</Label>
          <Switch
            checked={draftIsDefault}
            onCheckedChange={setDraftIsDefault}
          />
        </div>

        <Button
          type="button"
          onClick={addPrice}
          disabled={!draftCurrency || !draftPrice}
        >
          <Plus className="size-4" />
          إضافة السعر
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          لم تتم إضافة أسعار بعد
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium" dir="ltr">
                  {field.currency_symbol}
                  {field.price}
                </span>
                {field.is_default && <Badge>افتراضي</Badge>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
