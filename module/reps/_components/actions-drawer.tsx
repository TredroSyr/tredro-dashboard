"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check } from "lucide-react";
import { IconRenderer } from "@/assets/icons/iconRenderer";

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
  FormDescription,
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

import { Rep } from "../types";
import {
  useCreateRepMutation,
  useUpdateRepMutation,
  useRepQuery,
} from "../hooks";
import { PhoneInput } from "@/components/tredro/phone-input";

const APP_URL = "https://tredro-mandoub.vercel.app/";
const CREDENTIALS_AUTO_CLOSE_MS = 5000;

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
    referral_code: z.string().min(1, "كود الإحالة مطلوب"),
    password:
      mode === "create"
        ? passwordSchema
        : z.union([passwordSchema, z.literal("")]).optional(),
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
      "تم إنشاء حسابك كمندوب بنجاح، وفيما يلي بيانات الدخول الخاصة بك:",
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
              ? "تم إنشاء حساب المندوب بنجاح، يمكنه تسجيل الدخول إلى التطبيق باستخدام بيانات الاعتماد التالية. يُرجى نسخها وإرسالها إليه."
              : "تم تعيين كلمة مرور جديدة لحساب المندوب. يُرجى نسخ البيانات وإرسالها إليه."}
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

export function RepFormDrawer({
  mode,
  repId,
  open,
  onOpenChange,
}: RepFormDrawerProps) {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = React.useState(false);
  const schema = React.useMemo(() => buildSchema(mode), [mode]);

  const { data: repRes, isLoading: isLoadingRep } = useRepQuery(repId, {
    enabled: mode === "edit" && open && Boolean(repId),
  });
  const rep = repRes?.data.rep as Rep | undefined;

  const { mutate: createRep, isPending: isCreating } = useCreateRepMutation();
  const { mutate: updateRep, isPending: isUpdating } = useUpdateRepMutation();

  const isSaving = isCreating || isUpdating;

  const [credentials, setCredentials] = React.useState<Credentials | null>(
    null,
  );

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

  const [phoneReady, setPhoneReady] = React.useState(mode === "create");

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
      setPhoneReady(true);
      return;
    }

    setPhoneReady(false);
    if (rep) {
      form.reset({
        name: rep.name,
        phone: rep.phone,
        referral_code: rep.referral_code,
        password: "",
        is_active: rep.is_active,
      });
      setPhoneReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, rep]);

  const isFieldsLoading = mode === "edit" && (isLoadingRep || !phoneReady);

  const onSubmit = (values: RepFormValues) => {
    const trimmedName = values.name.trim();
    const trimmedPhone = values.phone.trim();

    if (mode === "create") {
      const password = values.password as string;
      createRep(
        {
          name: trimmedName,
          phone: trimmedPhone,
          referral_code: values.referral_code.trim(),
          password,
          is_active: values.is_active,
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
        },
      );
      return;
    }

    const newPassword = values.password?.trim();

    updateRep(
      {
        id: repId as number,
        name: trimmedName,
        phone: trimmedPhone,
        referral_code: values.referral_code.trim(),
        password: newPassword || undefined,
        is_active: values.is_active,
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
      },
    );
  };

  const phoneInputKey =
    mode === "edit"
      ? `edit-${repId}-${phoneReady ? "ready" : "loading"}`
      : "create";

  return (
    <>
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
                  <Button
                    type="submit"
                    disabled={isSaving || isFieldsLoading}
                    size="sm"
                  >
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-right block">الاسم</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          isLoading={isFieldsLoading}
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
                          key={phoneInputKey}
                          id="phone"
                          value={field.value}
                          onChange={field.onChange}
                          isLoading={isFieldsLoading}
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
                          isLoading={isFieldsLoading}
                          placeholder="REF123"
                          dir="ltr"
                          className="h-12"
                        />
                      </FormControl>
                      <FormDescription className="text-right">
                        كود الإحالة هو رمز خاص بالمندوب، يُستخدم عند تسجيل عميل
                        جديد عبر التطبيق. فور استخدام العميل لهذا الكود أثناء
                        التسجيل، يُربط حسابه تلقائيًا بالمندوب صاحب الكود، ويصبح
                        هذا المندوب هو المسؤول عن متابعة العميل، بحيث تصله جميع
                        طلباته ومراسلاته اللاحقة.
                      </FormDescription>
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
                            {...field}
                            isLoading={isFieldsLoading}
                            type={showPassword ? "text" : "password"}
                            placeholder={
                              mode === "create"
                                ? "8 أحرف على الأقل مع حرف ورقم"
                                : "اتركه فارغاً لعدم التغيير"
                            }
                            dir="ltr"
                            className="h-12 pl-4 pr-12 w-full"
                          />
                          {!isFieldsLoading && (
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
                          isLoading={isFieldsLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
