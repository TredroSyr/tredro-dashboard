"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AxiosError } from "axios";
import { toast } from "sonner";

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
import { useLoginMutation } from "@/module/auth/hook";
import { ApiErrorResponse } from "@/module/auth/types";

const HERO_TITLES = [
  "إدارة مناديبك بذكاء",
  "كل طلبياتك تحت سيطرتك",
  "منصّة واحدة لفريق مبيعاتك",
  "فواتيرك ومخزونك بمكان واحد",
];

const loginSchema = z.object({
  phone: z
    .string()
    .min(9, "رقم الهاتف غير صالح")
    .regex(/^[0-9+]+$/, "رقم الهاتف غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const HERO_TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const;

const AdminLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const isKeyboardOpen = useKeyboardOpen();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useLoginMutation({
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, keyof LoginFormValues> = {
            phone: "phone",
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
        toast.error(error.response?.data?.message || "حدث خطأ، حاول مرة أخرى");
      }
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      phone: values.phone,
      password: values.password,
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
                    لوحة تحكم شركتك لإدارة المناديب، الطلبيات، الفواتير، والمخزون
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

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-12 rounded-full text-white"
                >
                  {loginMutation.isPending
                    ? "جاري تسجيل الدخول..."
                    : "تسجيل الدخول"}
                </Button>
              </form>
            </Form>

            <p className="text-center mt-4 text-xs text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                href="/auth/register"
                className="underline hover:no-underline text-primary/80 font-medium"
              >
                إنشاء حساب شركة جديد
              </Link>
            </p>
          </motion.div>
        </div>

        <div className="hidden lg:block w-full max-w-140">
          <AuthDashboardPreview variant="login" />
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
