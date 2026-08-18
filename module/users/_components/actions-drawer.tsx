"use client";
import * as React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

import { ModuleName, Permission, SubUser } from "../types";
import {
  useCreateSubUserMutation,
  useUpdateSubUserMutation,
  useModulesQuery,
  useSubUserQuery,
} from "../hooks";
import { PhoneInput } from "@/components/tredro/phone-input";

const PERMISSION_LEVELS = ["none", "read", "read_write"] as const;
type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

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
    email: z
      .string()
      .email("بريد إلكتروني غير صالح")
      .optional()
      .or(z.literal("")),
    password:
      mode === "create"
        ? z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف")
        : z
            .string()
            .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف")
            .optional()
            .or(z.literal("")),
    is_active: z.boolean(),
    permissions: z.record(z.enum(PERMISSION_LEVELS)),
  });
}

type SubUserFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface SubUserFormDrawerProps {
  mode: "create" | "edit";
  subUserId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubUserFormDrawer({
  mode,
  subUserId,
  open,
  onOpenChange,
}: SubUserFormDrawerProps) {
  const isMobile = useIsMobile();
  const schema = React.useMemo(() => buildSchema(mode), [mode]);

  const { data: modulesRes } = useModulesQuery();
  const modules = modulesRes?.data.modules ?? [];

  const { data: subUserRes, isLoading: isLoadingSubUser } = useSubUserQuery(
    subUserId as string,
    { enabled: mode === "edit" && open && Boolean(subUserId) },
  );
  const subUser = subUserRes?.data as SubUser | undefined;

  const { mutate: createSubUser, isPending: isCreating } =
    useCreateSubUserMutation();
  const { mutate: updateSubUser, isPending: isUpdating } =
    useUpdateSubUserMutation();

  const isSaving = isCreating || isUpdating;

  const form = useForm<SubUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      is_active: true,
      permissions: {},
    },
  });

  React.useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      const permissions: Record<string, PermissionLevel> = {};
      modules.forEach((m) => {
        permissions[m.value] = "none";
      });
      form.reset({
        name: "",
        phone: "",
        email: "",
        password: "",
        is_active: true,
        permissions,
      });
      return;
    }

    if (mode === "edit" && subUser) {
      const permissions: Record<string, PermissionLevel> = {};
      modules.forEach((m) => {
        const existing = subUser.permissions?.find((p) => p.module === m.value);
        if (!existing) {
          permissions[m.value] = "none";
        } else if (existing.can_action) {
          permissions[m.value] = "read_write";
        } else {
          permissions[m.value] = "read";
        }
      });
      form.reset({
        name: subUser.name,
        phone: subUser.phone,
        email: subUser.email ?? "",
        password: "",
        is_active: subUser.is_active,
        permissions,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, subUser, modules]);

  const onSubmit = (values: SubUserFormValues) => {
    const permissions: Permission[] = Object.entries(values.permissions)
      .filter(([, level]) => level !== "none")
      .map(([module, level]) => ({
        module: module as ModuleName,
        can_view: true,
        can_action: level === "read_write",
      }));

    if (mode === "create") {
      createSubUser(
        {
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email?.trim() || undefined,
          password: values.password as string,
          permissions,
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    updateSubUser(
      {
        id: subUserId as string,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        password: values.password?.trim() || undefined,
        is_active: values.is_active,
        permissions,
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
      {/*
        Mobile: bottom sheet capped at 92% of the viewport height (never the
        full screen) with rounded top corners, so the app is visibly still
        behind it and it never fights the browser chrome / safe areas.
        Desktop: fixed-width side panel, unchanged from before.
      */}
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
            {/* Header: extra top padding on mobile clears the drag handle */}
            <DrawerHeader
              className="
                flex-row items-center justify-between gap-3
                px-4 pt-6 pb-3
                sm:px-6 sm:pt-4
                sticky top-0 z-10 bg-background border-b border-border
              "
            >
              <DrawerTitle className="text-right text-base sm:text-lg">
                {mode === "create" ? "إضافة مستخدم  جديد" : "تعديل المستخدم "}
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

            {/* Scrollable body: generous padding on all sides, extra bottom
                padding on mobile so content clears the home-indicator area */}
            <div
              className="
                flex flex-col gap-4
                overflow-y-auto flex-1 min-h-0
                px-4 py-4 pb-8
                sm:px-6 sm:pb-6
              "
            >
              {mode === "edit" && isLoadingSubUser ? (
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
                            placeholder="أدخل اسم المستخدم"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right block">
                          البريد الإلكتروني (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="example@mail.com"
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

                  {mode === "edit" && (
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
                  )}

                  <div className="flex flex-col gap-2">
                    <FormLabel className="text-right block">
                      الصلاحيات
                    </FormLabel>
                    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                      {modules.map((m) => (
                        <div
                          key={m.value}
                          className="flex flex-col gap-2 p-3 sm:p-4"
                        >
                          <span className="text-sm font-medium">{m.label}</span>
                          <Controller
                            control={form.control}
                            name={`permissions.${m.value}`}
                            render={({ field }) => {
                              const enabled = field.value !== "none";
                              const canEdit = field.value === "read_write";

                              return (
                                <div className="flex flex-col gap-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={enabled}
                                      onCheckedChange={(checked) =>
                                        field.onChange(
                                          checked ? "read" : "none",
                                        )
                                      }
                                    />
                                    منح الوصول لهذا القسم
                                  </label>
                                  <label
                                    className={`flex items-center gap-2 text-sm pr-6 ${
                                      enabled ? "" : "opacity-50"
                                    }`}
                                  >
                                    <Checkbox
                                      disabled={!enabled}
                                      checked={canEdit}
                                      onCheckedChange={(checked) =>
                                        field.onChange(
                                          checked ? "read_write" : "read",
                                        )
                                      }
                                    />
                                    السماح بالإضافة والتعديل والحذف (وليس فقط
                                    العرض)
                                  </label>
                                </div>
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
