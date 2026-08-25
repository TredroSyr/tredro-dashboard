"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/module/auth/store/auth-store";
import {
  useBusinessTypesQuery,
  useLocationsQuery,
  useOnboardingMutation,
} from "@/module/auth/hook/onboarding";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { ApiErrorResponse } from "@/module/auth/types";
import { useRouter } from "next/navigation";
import { useAuthInit } from "@/module/auth/hook/use-token-guard";

const STEPS = [
  { key: "images", label: "الشعار والغلاف" },
  { key: "location", label: "الموقع" },
  { key: "description", label: "وصف الشركة" },
  { key: "category", label: "نوع النشاط" },
];

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;

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
  useAuthInit();
  const [stepIndex, setStepIndex] = useState(0);
  const isKeyboardOpen = useKeyboardOpen();
  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const companyName = user?.company?.name;
  const phoneNumber = user?.phone || null;

  const { data: locations = [], isLoading: locationsLoading } =
    useLocationsQuery();
  const { data: businessTypes = [], isLoading: businessTypesLoading } =
    useBusinessTypesQuery();

  const onboardingMutation = useOnboardingMutation({
    onSuccess: (response) => {
      if (response?.success && response.data?.company) {
        // Update store with actual company data from API response
        updateUser({
          company: response.data.company,
        });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.entries(errors).forEach(([field, messages]) => {
          const fieldMap: Record<string, string> = {
            governorate: "governorate",
            region: "region",
            description: "description",
            business_type: "business_type",
          };
          const mapped = fieldMap[field];
          if (mapped === "governorate" || mapped === "region") {
            locationForm.setError(mapped, { message: messages[0] });
          } else if (mapped === "description") {
            descriptionForm.setError("description", { message: messages[0] });
          } else if (mapped === "business_type") {
            setCategoryError(messages[0]);
          } else {
            toast.error(messages[0]);
          }
        });
      } else {
        toast.error(error.response?.data?.message || "حدث خطأ، حاول مرة أخرى");
      }
    },
  });

  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: { governorate: "", region: "" },
  });

  const descriptionForm = useForm<z.infer<typeof descriptionSchema>>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: { description: "" },
  });

  const watchedGovernorate = locationForm.watch("governorate");
  const watchedRegion = locationForm.watch("region");
  const watchedDescription = descriptionForm.watch("description");

  const governorateOptions = locations.map((loc) => ({
    value: loc.governorate,
    label: loc.governorate,
  }));

  const availableRegions =
    locations.find((loc) => loc.governorate === watchedGovernorate)?.regions ??
    [];
  const regionOptions = availableRegions.map((r) => ({ value: r, label: r }));

  const businessTypeOptions = businessTypes.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const governorateLabel = watchedGovernorate || undefined;
  const regionLabel = watchedRegion || undefined;
  const categoryData = businessTypes.find((c) => c.value === selectedCategory);

  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setImagesError("حجم الشعار يجب أن يكون أقل من 2 ميغابايت");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setImagesError(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_COVER_SIZE) {
      setImagesError("حجم الغلاف يجب أن يكون أقل من 5 ميغابايت");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
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

  const onLocationSubmit = () => goNext();
  const onDescriptionSubmit = () => goNext();

  const onFinish = () => {
    if (!selectedCategory) {
      setCategoryError("يرجى اختيار نوع نشاط الشركة");
      return;
    }

    onboardingMutation.mutate({
      logo: logoFile,
      cover: coverFile,
      governorate: locationForm.getValues("governorate"),
      region: locationForm.getValues("region"),
      description: descriptionForm.getValues("description"),
      business_type: selectedCategory,
    });
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 gap-12 lg:gap-20 overflow-hidden">
        <div className="w-full max-w-xl">
          <AnimatePresence initial={false}>
            {!isKeyboardOpen && (
              <motion.div
                key="stepper"
                initial={{ height: 0, opacity: 0, y: -12 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="w-full overflow-hidden"
              >
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">
                      {STEPS[stepIndex].label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {stepIndex + 1}/{STEPS.length}
                    </span>
                  </div>
                  <div className="relative w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute inset-y-0 right-0 bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {stepIndex === 0 && (
              <motion.div
                key="step-images"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="font-serif-ar text-xl sm:text-2xl font-bold text-foreground mb-2">
                    لنتعرف على شركتك
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    أضف شعار شركتك وصورة الغلاف الخاصة بها
                  </p>
                </div>

                <div className="mb-6">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="relative w-full h-28 sm:h-32 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-primary/4/50 hover:bg-primary/4 transition-colors flex items-center justify-center"
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
                        <span className="text-xs text-muted-foreground text-center px-4">
                          اضغط لرفع صورة غلاف الشركة
                        </span>
                      </div>
                    )}
                  </button>
                  <span className="text-[11px] text-muted-foreground mt-1.5 block">
                    اختياري — تظهر خلف شعار شركتك في المتجر (بحد أقصى 5
                    ميغابايت)
                  </span>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-primary/4/50 hover:bg-primary/4 transition-colors"
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
                  <span className="text-xs text-muted-foreground mt-2 text-center px-4">
                    اضغط لرفع شعار الشركة (بحد أقصى 2 ميغابايت)
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
                  className="w-full h-11 sm:h-12 rounded-xl text-white mt-2"
                >
                  التالي
                </Button>
              </motion.div>
            )}

            {stepIndex === 1 && (
              <motion.div
                key="step-location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="font-serif-ar text-xl sm:text-2xl font-bold text-foreground mb-2">
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
                            <SearchableSelect
                              options={governorateOptions}
                              value={field.value}
                              onChange={(val) => {
                                field.onChange(val);
                                locationForm.setValue("region", "");
                              }}
                              placeholder="اختر المحافظة"
                              searchPlaceholder="ابحث عن محافظة..."
                              emptyText="لا توجد محافظات مطابقة"
                              loading={locationsLoading}
                            />
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
                            <SearchableSelect
                              options={regionOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="اختر المنطقة"
                              searchPlaceholder="ابحث عن منطقة..."
                              emptyText="لا توجد مناطق مطابقة"
                              disabled={!watchedGovernorate}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1 h-11 sm:h-12 rounded-xl"
                      >
                        العودة
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11 sm:h-12 rounded-xl text-white"
                      >
                        التالي
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {stepIndex === 2 && (
              <motion.div
                key="step-description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="font-serif-ar text-xl sm:text-2xl font-bold text-foreground mb-2">
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
                              className="min-h-32 sm:min-h-40 rounded-xl resize-none"
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

                    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="flex-1 h-11 sm:h-12 rounded-xl"
                      >
                        العودة
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11 sm:h-12 rounded-xl text-white"
                      >
                        التالي
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {stepIndex === 3 && (
              <motion.div
                key="step-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 md:p-8"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="font-serif-ar text-xl sm:text-2xl font-bold text-foreground mb-2">
                    ما هو نشاط شركتك؟
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    اختر التصنيف الأقرب لطبيعة عمل شركتك
                  </p>
                </div>

                {businessTypesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-xl bg-primary/5 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="max-h-[220px] sm:max-h-[172px] overflow-y-auto pr-1 mb-2 -mr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {businessTypeOptions.map((option) => {
                        const isSelected = selectedCategory === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(option.value);
                              setCategoryError(null);
                            }}
                            className={`flex flex-col cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 h-20 text-center transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border bg-primary/4/50 hover:bg-primary/4"
                            }`}
                          >
                            <IconRenderer
                              name={
                                isSelected ? "tick_filled" : "star_outlined"
                              }
                              className={`w-5 h-5 ${
                                isSelected
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`text-[11px] font-medium leading-tight line-clamp-2 ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {categoryError && (
                  <p className="text-xs text-destructive text-center mb-2">
                    {categoryError}
                  </p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 h-11 sm:h-12 rounded-xl"
                  >
                    العودة
                  </Button>
                  <Button
                    type="button"
                    onClick={onFinish}
                    disabled={onboardingMutation.isPending}
                    className="flex-1 h-11 sm:h-12 rounded-xl text-white"
                  >
                    {onboardingMutation.isPending
                      ? "جارِ الإرسال..."
                      : "إنهاء الإعداد"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleSkip}
            disabled={onboardingMutation.isPending}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4"
          >
            تخطي الإعداد
          </button>
        </div>

        {/* Preview panel: hidden on mobile/tablet, visible from lg breakpoint up */}
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

            <div className="mx-6 mb-6 rounded-xl border border-border bg-primary/4/40 overflow-hidden">
              <div className="h-20 relative bg-gradient-to-l from-primary/25 to-primary/5">
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
                  className="absolute -bottom-7 !z-50 right-5 w-16 h-16 rounded-2xl border-4 border-card bg-card overflow-hidden flex items-center justify-center shadow-sm"
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

              <div className="mt-9 px-5 pb-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {companyName}
                    </p>

                    {phoneNumber && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <IconRenderer
                          name="tick_filled"
                          className="w-3 h-3 text-muted-foreground shrink-0"
                        />
                        <span
                          className="text-[11px] text-muted-foreground truncate"
                          dir="ltr"
                        >
                          {phoneNumber}
                        </span>
                      </div>
                    )}

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
                        <IconRenderer name="tick_filled" className="w-3 h-3" />
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
