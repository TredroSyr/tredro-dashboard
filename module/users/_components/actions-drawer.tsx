"use client";
import * as React from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { ModuleName, Permission, SubUser } from "../types";
import {
  useCreateSubUserMutation,
  useUpdateSubUserMutation,
  useModulesQuery,
  useSubUserQuery,
} from "../hooks";
import { PhoneInput } from "@/components/tredro/phone-input";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { ApiErrorResponse } from "@/module/auth/types";

const APP_URL = "https://tredro-dashboard.vercel.app/";
const CREDENTIALS_AUTO_CLOSE_MS = 5000;

const PERMISSION_LEVELS = ["none", "read", "read_write"] as const;
type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

interface Credentials {
  mode: "create" | "edit";
  name: string;
  phone: string;
  password: string;
}

function buildCredentialsMessage(
  mode: "create" | "edit",
  name: string,
  phone: string,
  password: string,
) {
  if (mode === "create") {
    return [
      `أهلاً بك ${name} في منصة tredro `,
      "تم إنشاء حسابك كمستخدم بنجاح، وفيما يلي بيانات الدخول الخاصة بك:",
      `رابط الدخول: ${APP_URL}`,
      `رقم الهاتف: ${phone}`,
      `كلمة المرور: ${password}`,
    ].join("\n");
  }

  return [
    `مرحباً ${name}،`,
    "تم تحديث كلمة المرور الخاصة بحسابك على منصة tredro وفيما يلي بياناتك المحدثة:",
    `رابط الدخول: ${APP_URL}`,
    `رقم الهاتف: ${phone}`,
    `كلمة المرور الجديدة: ${password}`,
  ].join("\n");
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (!credentials) {
      setCopied(false);
      return;
    }

    setProgress(100);
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(
        0,
        100 - (elapsed / CREDENTIALS_AUTO_CLOSE_MS) * 100,
      );
      setProgress(remaining);
    }, 50);

    const timeout = setTimeout(() => {
      onClose();
    }, CREDENTIALS_AUTO_CLOSE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

  const handleCopy = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(
        buildCredentialsMessage(
          credentials.mode,
          credentials.name,
          credentials.phone,
          credentials.password,
        ),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <AlertDialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="text-right overflow-hidden">
        {credentials && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${progress}%`,
                transition: "width 50ms linear",
              }}
            />
          </div>
        )}

        <AlertDialogHeader>
          <AlertDialogTitle>
            {credentials?.mode === "create"
              ? `أهلاً بك ${credentials.name}`
              : "تم تحديث كلمة المرور بنجاح"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {credentials?.mode === "create"
              ? "تم إنشاء حساب المستخدم بنجاح، يمكنه تسجيل الدخول إلى التطبيق باستخدام بيانات الاعتماد التالية. يُرجى نسخها وإرسالها إليه."
              : "تم تعيين كلمة مرور جديدة لحساب المستخدم. يُرجى نسخ البيانات وإرسالها إليه."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {credentials && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">الرابط</span>
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium break-all text-primary underline underline-offset-2 hover:opacity-80"
              >
                {APP_URL}
              </a>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">الهاتف</span>
              <PhoneInput value={credentials.phone} readOnly></PhoneInput>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">كلمة المرور</span>
              <span className="font-medium tabular-nums">
                {credentials.password}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              تم نسخ البيانات
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              نسخ البيانات
            </>
          )}
        </button>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>تم</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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

const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل")
  .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");

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
        ? passwordSchema
        : z
            .union([passwordSchema, z.literal("")])
            .optional(),
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
  const [showPassword, setShowPassword] = React.useState(false);
  const schema = React.useMemo(() => buildSchema(mode), [mode]);

  const { data: modulesRes } = useModulesQuery();
  const modules = modulesRes?.data.modules ?? [];

  const { data: subUserRes, isLoading: isLoadingSubUser } = useSubUserQuery(
    subUserId as string,
    { enabled: mode === "edit" && open && Boolean(subUserId) },
  );
  const subUser = subUserRes?.data?.subuser as SubUser | undefined;

  const { mutate: createSubUser, isPending: isCreating } =
    useCreateSubUserMutation();
  const { mutate: updateSubUser, isPending: isUpdating } =
    useUpdateSubUserMutation();

  const isSaving = isCreating || isUpdating;

  const [credentials, setCredentials] = React.useState<Credentials | null>(
    null,
  );

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

    // For edit mode, set default permissions immediately when modules are available
    const permissions: Record<string, PermissionLevel> = {};
    modules.forEach((m) => {
      if (subUser) {
        const existing = subUser.permissions?.find((p) => p.module === m.value);
        if (!existing) {
          permissions[m.value] = "none";
        } else if (existing.can_action) {
          permissions[m.value] = "read_write";
        } else {
          permissions[m.value] = "read";
        }
      } else {
        permissions[m.value] = "none";
      }
    });

    if (subUser) {
      form.reset({
        name: subUser.name,
        phone: subUser.phone,
        email: subUser.email ?? "",
        password: "",
        is_active: subUser.is_active,
        permissions,
      });
    } else {
      // Reset with empty values while loading
      form.reset({
        name: "",
        phone: "",
        email: "",
        password: "",
        is_active: true,
        permissions,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, subUser, modules]);

  const onSubmit = (values: SubUserFormValues) => {
    const trimmedName = values.name.trim();
    const trimmedPhone = values.phone.trim();
    const permissions: Permission[] = Object.entries(values.permissions)
      .filter(([, level]) => level !== "none")
      .map(([module, level]) => ({
        module: module as ModuleName,
        can_view: true,
        can_action: level === "read_write",
      }));

    const handleApiError = (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof SubUserFormValues> = {
            name: "name",
            phone: "phone",
            email: "email",
            password: "password",
          };
          const mapped = fieldMap[field];
          if (mapped) {
            form.setError(mapped, { message: messages[0] });
          } else {
            toast.error(messages[0]);
          }
        });
      } else {
        toast.error(
          error.response?.data?.message || "حدث خطأ، حاول مرة أخرى",
        );
      }
    };

    if (mode === "create") {
      const password = values.password as string;
      createSubUser(
        {
          name: trimmedName,
          phone: trimmedPhone,
          email: values.email?.trim() || undefined,
          password,
          permissions,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setCredentials({
              mode: "create",
              name: trimmedName,
              phone: trimmedPhone,
              password,
            });
          },
          onError: handleApiError,
        },
      );
      return;
    }

    const newPassword = values.password?.trim();

    updateSubUser(
      {
        id: Number(subUserId),
        name: trimmedName,
        phone: trimmedPhone,
        email: values.email?.trim() || undefined,
        password: newPassword || undefined,
        is_active: values.is_active,
        permissions,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          if (newPassword) {
            setCredentials({
              mode: "edit",
              name: trimmedName,
              phone: trimmedPhone,
              password: newPassword,
            });
          }
        },
        onError: handleApiError,
      },
    );
  };

  return (
    <>
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
                        isLoading={isLoadingSubUser}
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
                        isLoading={isLoadingSubUser}
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
                        isLoading={isLoadingSubUser}
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
                      <div className="relative w-full">
                        <Input
                          isLoading={isLoadingSubUser}
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={
                            mode === "create"
                              ? "8 أحرف على الأقل مع حرف ورقم"
                              : "اتركه فارغاً لعدم التغيير"
                          }
                          dir="ltr"
                          className="h-12 pl-4 pr-12 w-full"
                        />
                        {!isLoadingSubUser && (
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
                            tabIndex={-1}
                          >
                            <IconRenderer
                              name={
                                showPassword
                                  ? "eye_invisible_outlined"
                                  : "eye_visible_outlined"
                              }
                              className="w-4 h-4"
                            />
                          </button>
                        )}
                      </div>
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
                          isLoading={isLoadingSubUser}
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
            </div>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>

    <CredentialsDialog
      credentials={credentials}
      onClose={() => setCredentials(null)}
    />
    </>
  );
}
