"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { IconRenderer } from "@/assets/icons/iconRenderer";

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

const HERO_TITLES = [
  "إدارة مناديبك بذكاء",
  "كل طلبياتك تحت سيطرتك",
  "منصّة واحدة لفريق مبيعاتك",
];

const MOCK_TABS = ["أداء المناديب", "نظرة عامة"];

const REPS_CONTENT = {
  reps: [
    { name: "محمد العلي", type: "مفرّق", orders: 42 },
    { name: "خالد حسن", type: "جملة", orders: 35 },
    { name: "أحمد سالم", type: "مفرّق", orders: 29 },
  ],
};

const OVERVIEW_CONTENT = {
  stats: [
    { label: "مندوب نشط", value: "18", icon: "users_outlined" as const },
    { label: "زبون مسجّل", value: "312", icon: "users_outlined" as const },
    { label: "طلبية اليوم", value: "47", icon: "star_outlined" as const },
  ],
  activities: [
    { text: "محمد العلي أرسل طلبية جديدة", time: "قبل 5 دقائق" },
    { text: "تمت الموافقة على طلبية خالد حسن", time: "قبل 20 دقيقة" },
  ],
};

const loginSchema = z.object({
  phone: z
    .string()
    .min(9, "رقم الهاتف غير صالح")
    .regex(/^[0-9+]+$/, "رقم الهاتف غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const AdminLoginPage = () => {
  const [activeTab, setActiveTab] = useState("أداء المناديب");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // const { mutate: loginMutate, isPending } = useLoginMutation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoggingIn(true);
    try {
      console.log(values);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-[calc(100vh-150px)] overflow-hidden flex flex-col bg-background">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 gap-12 lg:gap-20 overflow-hidden">
        <div className="flex flex-col items-center lg:items-start max-w-130 w-full">
          <div className="text-center lg:text-right mb-10">
            <h1 className="font-serif-ar text-4xl sm:text-5xl font-bold leading-tight mb-4 text-foreground">
              <TypingText
                texts={HERO_TITLES}
                typingSpeed={70}
                deletingSpeed={35}
                pauseDuration={2500}
              />
            </h1>
            <p className="text-sm text-muted-foreground">
              لوحة تحكم الشركة لإدارة المناديب والطلبات والفواتير
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-card border border-border rounded-2xl p-8"
          >
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={loginForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          id="phone"
                          value={field.value}
                          onChange={field.onChange}
                          defaultCountry="sy"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="كلمة المرور"
                            type={showPassword ? "text" : "password"}
                            className="h-12 rounded-xl pe-4 ps-11"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  disabled={isLoggingIn}
                  className="w-full h-12 rounded-xl text-white"
                >
                  {isLoggingIn ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
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
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-border overflow-hidden bg-card"
          >
            <div className="flex items-center justify-center pt-6 pb-4">
              <div className="flex rounded-full p-1 bg-primary/4">
                {MOCK_TABS.map((tab) => (
                  <Button
                    key={tab}
                    variant="ghost"
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-primary text-white "
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "أداء المناديب" ? (
                <motion.div
                  key="reps"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="px-6 pb-6 space-y-3"
                >
                  {REPS_CONTENT.reps.map((rep, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-xl bg-primary/4/50 p-4 hover:bg-primary/4 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <IconRenderer
                          name="users_outlined"
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {rep.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rep.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-medium text-foreground">
                          {rep.orders} طلبية
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center">
                        <IconRenderer
                          name="book_outlined"
                          className="w-4 h-4 text-white"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        راقب أداء فريقك بسهولة
                      </span>
                    </div>
                    {[
                      "تابع طلبيات كل مندوب لحظياً",
                      "قارن الأداء بين المناديب",
                      "أدر الصلاحيات حسب الرول",
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <IconRenderer
                          name="tick_filled"
                          className="w-4 h-4 text-primary shrink-0"
                        />
                        <span className="text-sm text-muted-foreground">
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="px-6 pb-6 space-y-4"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {OVERVIEW_CONTENT.stats.map((stat, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-primary/4/50 p-4 flex flex-col items-center gap-2"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconRenderer
                            name={stat.icon}
                            className="w-4 h-4 text-primary"
                          />
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-[10px] text-muted-foreground text-center">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {OVERVIEW_CONTENT.activities.map((activity, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground">
                            نشاط جديد
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activity.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
