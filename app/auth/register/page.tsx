"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AxiosError } from "axios";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useKeyboardOpen } from "@/hooks/use-keyboard-open";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import TypingText from "@/components/tredro/typing-text";
import { PhoneInput } from "@/components/tredro/phone-input";
import AuthDashboardPreview from "@/components/tredro/auth-dashboard-preview";
import { useRegisterMutation } from "@/module/auth/hook";
import { ApiErrorResponse } from "@/module/auth/types";

const HERO_TITLES = [
  "ابدأ رحلتك معنا",
  "أدر شركتك باحتراف",
  "منصّة واحدة لفريقك",
];

const TRUST_POINTS = [
  "مستودعات مركزية أو خاصة بكل مندوب",
  "تحويل المخزون بين المستودعات والمناديب بضغطة زر",
];

const registerSchema = z
  .object({
    companyName: z.string().min(2, "اسم الشركة يجب أن يكون حرفين على الأقل"),
    phone: z
      .string()
      .min(9, "رقم الهاتف غير صالح")
      .regex(/^[0-9+]+$/, "رقم الهاتف غير صالح"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "كلمة المرور يجب أن تحتوي على أحرف وأرقام على الأقل",
      ),
    confirmPassword: z.string().min(8, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const HERO_TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useRegisterMutation({
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof RegisterFormValues> = {
            company_name: "companyName",
            phone: "phone",
            password: "password",
            password_confirm: "confirmPassword",
          };
          const mapped = fieldMap[field];
          if (mapped) {
            form.setError(mapped, { message: messages[0] });
          }
        });
      }
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      company_name: values.companyName,
      phone: values.phone,
      password: values.password,
      password_confirm: values.confirmPassword,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 gap-12 lg:gap-20 overflow-hidden">
        <div className="flex flex-col items-center lg:items-start max-w-130 w-full">
          <AnimatePresence initial={false}>
            {!isKeyboardOpen && (
              <motion.div
                key="hero"
                initial={{ height: 0, opacity: 0, y: -12 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -12 }}
                transition={HERO_TRANSITION}
                className="w-full overflow-hidden text-center lg:text-right"
              >
                <div className="mb-8">
                  <h1 className="font-serif-ar text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
                    <TypingText
                      texts={HERO_TITLES}
                      typingSpeed={70}
                      deletingSpeed={35}
                      pauseDuration={2500}
                    />
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    أنشئ حساب شركتك وابدأ بإدارة مناديبك، طلباتك، وفواتيرك من
                    مكان واحد
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-card border border-border rounded-2xl p-8"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="اسم الشركة"
                          className="h-12 w-full"
                          {...field}
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            placeholder="كلمة المرور"
                            type={showPassword ? "text" : "password"}
                            className="h-12 pl-4 pr-12 w-full"
                            {...field}
                          />
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
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            placeholder="تأكيد كلمة المرور"
                            type={showConfirmPassword ? "text" : "password"}
                            className="h-12 pl-4 pr-12 w-full"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
                            tabIndex={-1}
                          >
                            <IconRenderer
                              name={
                                showConfirmPassword
                                  ? "eye_invisible_outlined"
                                  : "eye_visible_outlined"
                              }
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-12 rounded-full text-white"
                >
                  {registerMutation.isPending
                    ? "جاري إنشاء الحساب..."
                    : "إنشاء الحساب"}
                </Button>
              </form>
            </Form>

            <p className="text-center mt-4 text-xs text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/auth/login"
                className="underline hover:no-underline text-primary/80 font-medium"
              >
                تسجيل الدخول
              </Link>
            </p>
          </motion.div>
        </div>
        <div className="hidden lg:block w-full max-w-140 space-y-4">
          <AuthDashboardPreview variant="register" />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
