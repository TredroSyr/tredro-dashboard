"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Rep } from "../types";
import {
  useCreateRepMutation,
  useUpdateRepMutation,
  useRepQuery,
} from "../hooks";
import { PhoneInput } from "@/components/tredro/phone-input";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

function buildSchema(mode: "create" | "edit") {
  return z.object({
    name: z.string().min(1, "الاسم مطلوب"),
    phone: z.string().min(1, "رقم الهاتف مطلوب"),
    referral_code: z.string().min(1, "كود الإحالة مطلوب"),
    password:
      mode === "create"
        ? z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف")
        : z
            .string()
            .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف")
            .optional()
            .or(z.literal("")),
    is_active: z.boolean(),
  });
}

type RepFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface RepFormDrawerProps {
  mode: "create" | "edit";
  repId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepFormDrawer({
  mode,
  repId,
  open,
  onOpenChange,
}: RepFormDrawerProps) {
  const isMobile = useIsMobile();
  const schema = React.useMemo(() => buildSchema(mode), [mode]);

  const { data: repRes, isLoading: isLoadingRep } = useRepQuery(repId, {
    enabled: mode === "edit" && open && Boolean(repId),
  });
  const rep = repRes?.data.rep as Rep | undefined;

  const { mutate: createRep, isPending: isCreating } = useCreateRepMutation();
  const { mutate: updateRep, isPending: isUpdating } = useUpdateRepMutation();

  const isSaving = isCreating || isUpdating;

  const form = useForm<RepFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      referral_code: "",
      password: "",
      is_active: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      form.reset({
        name: "",
        phone: "",
        referral_code: "",
        password: "",
        is_active: true,
      });
      return;
    }

    if (mode === "edit" && rep) {
      form.reset({
        name: rep.name,
        phone: rep.phone,
        referral_code: rep.referral_code,
        password: "",
        is_active: rep.is_active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, rep]);

  const onSubmit = (values: RepFormValues) => {
    if (mode === "create") {
      createRep(
        {
          name: values.name.trim(),
          phone: values.phone.trim(),
          referral_code: values.referral_code.trim(),
          password: values.password as string,
          is_active: values.is_active,
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    updateRep(
      {
        id: repId as number,
        name: values.name.trim(),
        phone: values.phone.trim(),
        referral_code: values.referral_code.trim(),
        password: values.password?.trim() || undefined,
        is_active: values.is_active,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "left"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent
        className="
          flex flex-col
          w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl
          sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none
          md:max-w-xl
          lg:max-w-3xl
        "
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DrawerHeader
              className="
                flex-row items-center justify-between gap-3
                px-4 pt-6 pb-3
                sm:px-6 sm:pt-4
                sticky top-0 z-10 bg-background border-b border-border
              "
            >
              <DrawerTitle className="text-right text-base sm:text-lg">
                {mode === "create" ? "إضافة مندوب جديد" : "تعديل المندوب"}
              </DrawerTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="submit" disabled={isSaving} size="sm">
                  {isSaving ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
                <DrawerClose>
                  <Button variant="outline" type="button" size="sm">
                    إلغاء
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div
              className="
                flex flex-col gap-4
                overflow-y-auto flex-1 min-h-0
                px-4 py-4 pb-8
                sm:px-6 sm:pb-6
              "
            >
              {mode === "edit" && isLoadingRep ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  جارٍ التحميل...
                </p>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          الاسم
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="أدخل اسم المندوب"
                            className="text-right h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          رقم الهاتف
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            id="phone"
                            value={field.value}
                            onChange={field.onChange}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referral_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          كود الإحالة
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="REF123"
                            dir="ltr"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          {mode === "create"
                            ? "كلمة المرور"
                            : "كلمة المرور الجديدة (اختياري)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder={
                              mode === "create"
                                ? "6 أحرف على الأقل"
                                : "اتركه فارغاً لعدم التغيير"
                            }
                            dir="ltr"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                        <FormLabel>الحساب مفعّل</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
