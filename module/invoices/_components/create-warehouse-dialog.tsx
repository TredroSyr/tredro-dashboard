"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useApiFormErrorHandler } from "@/hooks/use-api-form-error";
import { createWarehouseSchema, type CreateWarehouseFormValues } from "../schema";
import { useCreateWarehouseMutation } from "../hooks";
import type { Warehouse } from "../types";

export function CreateWarehouseDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (warehouse: Warehouse) => void;
}) {
  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: { name: "", address: "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ name: "", address: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { mutate, isPending } = useCreateWarehouseMutation();
  const handleApiError = useApiFormErrorHandler(form);
  const [banner, setBanner] = React.useState<string | null>(null);

  const onSubmit = (values: CreateWarehouseFormValues) => {
    setBanner(null);
    mutate(
      {
        name: values.name,
        address: values.address || undefined,
        kind: "central",
        owner_type: "company",
        is_active: true,
      },
      {
        onSuccess: (res) => {
          onOpenChange(false);
          onCreated(res.data.warehouse);
        },
        onError: (error) => setBanner(handleApiError(error).message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>مستودع شركة جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {banner && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {banner}
              </p>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستودع</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: المستودع الرئيسي" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان (اختياري)</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "جارٍ الحفظ..." : "إضافة المستودع"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
