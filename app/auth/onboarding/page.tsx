"use client";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------- Dummy data ----------------
const GOVERNORATES = [
  { value: "damascus", label: "دمشق" },
  { value: "aleppo", label: "حلب" },
  { value: "homs", label: "حمص" },
  { value: "lattakia", label: "اللاذقية" },
  { value: "daraa", label: "درعا" },
];

const REGIONS_BY_GOVERNORATE: Record<
  string,
  { value: string; label: string }[]
> = {
  damascus: [
    { value: "mazzeh", label: "المزة" },
    { value: "midan", label: "الميدان" },
    { value: "kafarsouseh", label: "كفرسوسة" },
  ],
  aleppo: [
    { value: "jamiliyeh", label: "الجميلية" },
    { value: "furqan", label: "الفرقان" },
  ],
  homs: [
    { value: "waer", label: "الوعر" },
    { value: "hamidiyeh", label: "الحميدية" },
  ],
  lattakia: [
    { value: "ziraa", label: "الزراعة" },
    { value: "shatee", label: "الشاطئ الأزرق" },
  ],
  daraa: [
    { value: "mahatta", label: "المحطة" },
    { value: "balad", label: "درعا البلد" },
  ],
};

const COMPANY_CATEGORIES = [
  { value: "food", label: "مواد غذائية", icon: "book_outlined" as const },
  { value: "electronics", label: "إلكترونيات", icon: "star_outlined" as const },
  { value: "clothing", label: "ألبسة", icon: "users_outlined" as const },
  {
    value: "cosmetics",
    label: "مستحضرات تجميل",
    icon: "star_outlined" as const,
  },
  { value: "home", label: "أدوات منزلية", icon: "book_outlined" as const },
  {
    value: "pharma",
    label: "أدوية ومستلزمات طبية",
    icon: "tick_filled" as const,
  },
];

const STEPS = [
  { key: "images", label: "الشعار والغلاف" },
  { key: "location", label: "الموقع" },
  { key: "description", label: "وصف الشركة" },
  { key: "category", label: "نوع النشاط" },
];

// TODO: replace with the real company name coming from the register step
// (e.g. via route params, context, or a server session) once wired up.
const DUMMY_COMPANY_NAME = "اسم شركتك";

// ---------------- Schemas ----------------
const locationSchema = z.object({
  governorate: z.string().min(1, "اختر المحافظة"),
  region: z.string().min(1, "اختر المنطقة"),
});

const descriptionSchema = z.object({
  description: z
    .string()
    .min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل")
    .max(500, "الوصف يجب ألا يتجاوز 500 حرف"),
});

const OnboardingPage = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: { governorate: "", region: "" },
  });

  const descriptionForm = useForm<z.infer<typeof descriptionSchema>>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: { description: "" },
  });

  // Live-watch fields so the store preview updates as the user types/selects,
  // not only after each step is submitted.
  const watchedGovernorate = locationForm.watch("governorate");
  const watchedRegion = locationForm.watch("region");
  const watchedDescription = descriptionForm.watch("description");

  const availableRegions = watchedGovernorate
    ? (REGIONS_BY_GOVERNORATE[watchedGovernorate] ?? [])
    : [];

  const governorateLabel = GOVERNORATES.find(
    (g) => g.value === watchedGovernorate,
  )?.label;
  const regionLabel = availableRegions.find(
    (r) => r.value === watchedRegion,
  )?.label;
  const categoryData = COMPANY_CATEGORIES.find(
    (c) => c.value === selectedCategory,
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    setImagesError(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const onImagesNext = () => {
    if (!logoPreview) {
      setImagesError("يرجى رفع شعار الشركة على الأقل للمتابعة");
      return;
    }
    goNext();
  };

  const goNext = () => setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((s) => Math.max(s - 1, 0));

  const onLocationSubmit = (values: z.infer<typeof locationSchema>) => {
    console.log("location", values);
    goNext();
  };

  const onDescriptionSubmit = (values: z.infer<typeof descriptionSchema>) => {
    console.log("description", values);
    goNext();
  };

  const onFinish = () => {
    if (!selectedCategory) {
      setCategoryError("يرجى اختيار نوع نشاط الشركة");
      return;
    }
    console.log("category", selectedCategory);
    // TODO: submit full onboarding payload + redirect to dashboard
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col bg-background">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-10 gap-10 lg:gap-16">
        {/* ---------------- Form column ---------------- */}
        <div className="w-full max-w-xl">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      scale: i === stepIndex ? 1.08 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      i < stepIndex
                        ? "bg-primary text-white"
                        : i === stepIndex
                          ? "bg-primary/15 text-primary border-2 border-primary"
                          : "bg-primary/4 text-muted-foreground"
                    }`}
                  >
                    {i < stepIndex ? (
                      <IconRenderer name="tick_filled" className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                  <span
                    className={`text-[11px] whitespace-nowrap ${
                      i === stepIndex
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="relative w-10 sm:w-16 h-0.5 mb-5 bg-primary/10 overflow-hidden rounded-full">
                    <motion.div
                      initial={false}
                      animate={{ width: i < stepIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-y-0 right-0 bg-primary"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Logo + Cover images */}
            {stepIndex === 0 && (
              <motion.div
                key="step-images"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <h2 className="font-serif-ar text-2xl font-bold text-foreground mb-2">
                    لنتعرف على شركتك
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    أضف شعار شركتك وصورة الغلاف الخاصة بها
                  </p>
                </div>

                {/* Cover image */}
                <div className="mb-6">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="relative w-full h-32 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-primary/4/50 hover:bg-primary/4 transition-colors flex items-center justify-center"
                  >
                    {coverPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverPreview}
                          alt="صورة غلاف الشركة"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            تغيير صورة الغلاف
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <IconRenderer
                          name="star_outlined"
                          className="w-5 h-5 text-muted-foreground"
                        />
                        <span className="text-xs text-muted-foreground">
                          اضغط لرفع صورة غلاف الشركة
                        </span>
                      </div>
                    )}
                  </button>
                  <span className="text-[11px] text-muted-foreground mt-1.5 block">
                    اختياري — تظهر خلف شعار شركتك في المتجر
                  </span>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-primary/4/50 hover:bg-primary/4 transition-colors"
                  >
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview}
                        alt="شعار الشركة"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconRenderer
                        name="star_outlined"
                        className="w-6 h-6 text-muted-foreground"
                      />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground mt-2">
                    اضغط لرفع شعار الشركة
                  </span>
                </div>

                {imagesError && (
                  <p className="text-xs text-destructive text-center mb-2">
                    {imagesError}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={onImagesNext}
                  className="w-full h-12 rounded-xl text-white mt-2"
                >
                  التالي
                </Button>
              </motion.div>
            )}

            {/* Step 2: Governorate + Region */}
            {stepIndex === 1 && (
              <motion.div
                key="step-location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <h2 className="font-serif-ar text-2xl font-bold text-foreground mb-2">
                    أين تقع شركتك؟
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    حدد المحافظة والمنطقة ليتمكن العملاء من إيجادك
                  </p>
                </div>

                <Form {...locationForm}>
                  <form
                    onSubmit={locationForm.handleSubmit(onLocationSubmit)}
                    className="space-y-3"
                  >
                    <FormField
                      control={locationForm.control}
                      name="governorate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                locationForm.setValue("region", "");
                              }}
                            >
                              <SelectTrigger className="h-12 rounded-xl w-full">
                                <SelectValue placeholder="اختر المحافظة" />
                              </SelectTrigger>
                              <SelectContent>
                                {GOVERNORATES.map((g) => (
                                  <SelectItem key={g.value} value={g.value}>
                                    {g.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationForm.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!watchedGovernorate}
                            >
                              <SelectTrigger className="h-12 rounded-xl w-full">
                                <SelectValue placeholder="اختر المنطقة" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRegions.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1 h-12 rounded-xl"
                      >
                        العودة
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 rounded-xl text-white"
                      >
                        التالي
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 3: Description */}
            {stepIndex === 2 && (
              <motion.div
                key="step-description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <h2 className="font-serif-ar text-2xl font-bold text-foreground mb-2">
                    عرّفنا على شركتك
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    اكتب وصفاً دقيقاً لنشاط شركتك ليظهر للعملاء والمناديب
                  </p>
                </div>

                <Form {...descriptionForm}>
                  <form
                    onSubmit={descriptionForm.handleSubmit(onDescriptionSubmit)}
                    className="space-y-3"
                  >
                    <FormField
                      control={descriptionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="مثال: شركة متخصصة بتوزيع المواد الغذائية الجافة والمعلبات لمحلات التجزئة والجملة في دمشق وريفها..."
                              className="min-h-40 rounded-xl resize-none"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between">
                            <FormMessage />
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {field.value?.length ?? 0}/500
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1 h-12 rounded-xl"
                      >
                        العودة
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 rounded-xl text-white"
                      >
                        التالي
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 4: Category */}
            {stepIndex === 3 && (
              <motion.div
                key="step-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <h2 className="font-serif-ar text-2xl font-bold text-foreground mb-2">
                    ما هو نشاط شركتك؟
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    اختر التصنيف الأقرب لطبيعة عمل شركتك
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                  {COMPANY_CATEGORIES.map((cat) => (
                    <motion.button
                      key={cat.value}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setCategoryError(null);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                        selectedCategory === cat.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-primary/4/50 hover:bg-primary/4"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedCategory === cat.value
                            ? "bg-primary text-white"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        <IconRenderer name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-foreground text-center">
                        {cat.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
                {categoryError && (
                  <p className="text-xs text-destructive text-center mb-2">
                    {categoryError}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 h-12 rounded-xl"
                  >
                    العودة
                  </Button>
                  <Button
                    type="button"
                    onClick={onFinish}
                    className="flex-1 h-12 rounded-xl text-white"
                  >
                    إنهاء الإعداد
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------- Live store preview column ---------------- */}
        <div className="hidden lg:block w-full max-w-120">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center gap-2 px-6 pt-6 pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconRenderer
                  name="star_outlined"
                  className="w-4 h-4 text-primary"
                />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground block">
                  هكذا سيظهر متجرك
                </span>
                <span className="text-[11px] text-muted-foreground">
                  معاينة حية تتحدّث مع كل خطوة
                </span>
              </div>
            </div>

            {/* Mock storefront card */}
            <div className="mx-6 mb-6 rounded-xl border border-border bg-primary/4/40 overflow-hidden">
              {/* Cover banner */}
              <div className="h-20 relative overflow-hidden bg-gradient-to-l from-primary/25 to-primary/5">
                <AnimatePresence mode="wait">
                  {coverPreview && (
                    <motion.img
                      key={coverPreview}
                      src={coverPreview}
                      alt="صورة غلاف الشركة"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </AnimatePresence>
                <motion.div
                  layout
                  transition={{ duration: 0.3 }}
                  className="absolute -bottom-7 right-5 w-16 h-16 rounded-2xl border-4 border-card bg-card overflow-hidden flex items-center justify-center shadow-sm"
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="شعار الشركة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <IconRenderer
                      name="users_outlined"
                      className="w-5 h-5 text-muted-foreground"
                    />
                  )}
                </motion.div>
              </div>

              <div className="pt-9 px-5 pb-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {DUMMY_COMPANY_NAME}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${governorateLabel ?? ""}-${regionLabel ?? ""}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1 mt-1"
                      >
                        <IconRenderer
                          name="star_outlined"
                          className="w-3 h-3 text-muted-foreground"
                        />
                        <span className="text-[11px] text-muted-foreground truncate">
                          {regionLabel && governorateLabel
                            ? `${regionLabel}، ${governorateLabel}`
                            : governorateLabel
                              ? governorateLabel
                              : "لم يتم تحديد الموقع بعد"}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-medium px-2 py-1 rounded-full shrink-0">
                    <IconRenderer name="star_outlined" className="w-3 h-3" />
                    4.8
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={categoryData?.value ?? "none"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3"
                  >
                    {categoryData ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        <IconRenderer
                          name={categoryData.icon}
                          className="w-3 h-3"
                        />
                        {categoryData.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-primary/4 px-2.5 py-1 rounded-full">
                        لم يتم اختيار نوع النشاط بعد
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={watchedDescription || "empty"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-muted-foreground leading-relaxed mt-3 line-clamp-3"
                  >
                    {watchedDescription
                      ? watchedDescription
                      : "سيظهر هنا وصف شركتك بمجرد كتابته في الخطوة الثانية."}
                  </motion.p>
                </AnimatePresence>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <IconRenderer
                      name="users_outlined"
                      className="w-3.5 h-3.5 text-muted-foreground"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      0 مندوب
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconRenderer
                      name="book_outlined"
                      className="w-3.5 h-3.5 text-muted-foreground"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      0 طلبية
                    </span>
                  </div>
                </div>

                <Button
                  disabled
                  className="w-full h-10 rounded-xl text-white mt-4 opacity-70"
                >
                  زيارة المتجر
                </Button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
              {[
                "هذا شكل تقريبي لكيفية ظهور شركتك للعملاء",
                "يمكنك تعديل هذه البيانات لاحقاً من الإعدادات",
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <IconRenderer
                    name="tick_filled"
                    className="w-4 h-4 text-primary shrink-0"
                  />
                  <span className="text-sm text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
