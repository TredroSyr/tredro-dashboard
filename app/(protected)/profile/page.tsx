"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Camera, Save } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuthStore } from "@/module/auth/store/auth-store";
import {
  useBusinessTypesQuery,
  useLocationsQuery,
  useOnboardingMutation,
} from "@/module/auth/hook/onboarding";
import { SearchableSelect } from "@/components/tredro/searchable-select";
import { ImageWithFallback } from "@/components/tredro/image-with-fallback";
import { ApiErrorResponse } from "@/module/auth/types";
import { useBannerStore } from "@/store/use-banner-store";
import { IconRenderer } from "@/assets/icons/iconRenderer";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const FORM_ID = "profile-onboarding-form";

const profileSchema = z.object({
  governorate: z.string().min(1, "اختر المحافظة"),
  region: z.string().min(1, "اختر المنطقة"),
  description: z
    .string()
    .min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل")
    .max(500, "الوصف يجب ألا يتجاوز 500 حرف"),
});

type ProfileValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const resetBanner = useBannerStore((state) => state.reset);

  const companyName = user?.company?.name || "Tredro";
  const companyLogo = user?.company?.logo;
  const companyCover = user?.company?.cover;
  const userName = user?.name || "";
  const onboardingCompleted = user?.company?.onboarding_completed;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(companyLogo || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(companyCover || null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    user?.company?.business_type || null
  );
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);

  // Sticky header only appears once the avatar/cover block has fully scrolled out of view.
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const avatarSentinelRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: locations = [], isLoading: locationsLoading } =
    useLocationsQuery();
  const { data: businessTypes = [], isLoading: businessTypesLoading } =
    useBusinessTypesQuery();

  const onboardingMutation = useOnboardingMutation({
    skipRedirect: true,
    onSuccess: (response) => {
      if (response?.success && response.data?.company) {
        // Update store with actual company data from API response
        updateUser({
          company: response.data.company,
        });
        resetBanner();
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
            form.setError(mapped, { message: messages[0] });
          } else if (mapped === "description") {
            form.setError("description", { message: messages[0] });
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

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      governorate: user?.company?.governorate || "",
      region: user?.company?.region || "",
      description: user?.company?.description || "",
    },
  });

  const watchedGovernorate = form.watch("governorate");

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

  const categoryData = businessTypes.find((c) => c.value === selectedCategory);

  // Watch the avatar block: once it's fully scrolled past, reveal the sticky mini header.
  useEffect(() => {
    const node = avatarSentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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

  const onSubmit = (values: ProfileValues) => {
    if (!selectedCategory) {
      setCategoryError("يرجى اختيار نوع نشاط الشركة");
      return;
    }

    onboardingMutation.mutate({
      logo: logoFile,
      cover: coverFile,
      governorate: values.governorate,
      region: values.region,
      description: values.description,
      business_type: selectedCategory,
    });
  };

  return (
    <div className="min-h-full flex flex-col bg-background">

  

      {/* Profile Header with Cover Photo */}
      <div className="relative ">
        {/* Cover Photo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative h-40 rounded-t-xl sm:h-52 md:h-60 overflow-hidden"
        >
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleCoverChange}
          />
          <ImageWithFallback
            src={coverPreview}
            alt="صورة غلاف الشركة"
            iconSize={64}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>تعديل صورة الغلاف</span>
          </button>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.3,
          }}
          className="absolute -bottom-12 !z-30 right-6 sm:right-8"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
          <div className="relative">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-lg">
              <AvatarImage
                src={logoPreview || companyLogo || undefined}
                alt="شعار الشركة"
                className="w-full h-full object-cover rounded-2xl"
              />
              <AvatarFallback className="bg-primary/20 text-primary flex items-center justify-center rounded-2xl">
                <IconRenderer name="no_image_filled" className="w-10 h-10 text-primary/50" />
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 left-0 bg-primary hover:bg-primary/90 text-white rounded-lg p-1.5 shadow-md transition-colors"
              aria-label="تعديل الشعار"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Sentinel: once this scrolls out of view, the sticky mini header appears */}
        <div ref={avatarSentinelRef} className="absolute bottom-0 h-px w-px" aria-hidden="true" />
      </div>

      {/* Company Info Below Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-14"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {companyName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{userName}</p>
            {categoryData && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-2">
                <IconRenderer name="tick_filled" className="w-3 h-3" />
                {categoryData.label}
              </span>
            )}
          </div>
          {!onboardingCompleted && (
            <span className="inline-flex items-center bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full">
              غير مكتمل
            </span>
          )}
        </div>
      </motion.div>

      {/* Form Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="flex-1 py-6"
      >
        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Location + Description side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <IconRenderer
                    name="star_outlined"
                    className="h-5 w-5 text-primary"
                  />
                  <span>الموقع</span>
                </h2>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SearchableSelect
                            options={governorateOptions}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              form.setValue("region", "");
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
                    control={form.control}
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
                </div>
              </motion.div>

              {/* Description Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <IconRenderer
                    name="star_outlined"
                    className="h-5 w-5 text-primary"
                  />
                  <span>وصف الشركة</span>
                </h2>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="مثال: شركة متخصصة بتوزيع المواد الغذائية الجافة والمعلبات..."
                          className="min-h-32 sm:min-h-36 rounded-xl resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {field.value?.length ?? 0}/500
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>
            </div>

            {/* Business Type Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="bg-card border border-border rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <IconRenderer
                  name="star_outlined"
                  className="h-5 w-5 text-primary"
                />
                <span>نوع النشاط</span>
              </h2>

              {businessTypesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-primary/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
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
                          className={`flex flex-col cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 h-20 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-primary/5 hover:bg-primary/10"
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
                            className={`text-xs font-medium leading-tight line-clamp-2 ${
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
                <p className="text-xs text-destructive text-center mt-3">
                  {categoryError}
                </p>
              )}
            </motion.div>
          </form>
        </Form>

        {/* Save Button at the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.85 }}
          className="pt-6 pb-6"
        >
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            disabled={onboardingMutation.isPending}
            className="w-full h-12 sm:h-14 rounded-xl text-base font-medium gap-2 text-white"
          >
            <Save className="h-4 w-4" />
            <span>
              {onboardingMutation.isPending ? "جارِ الحفظ..." : "حفظ"}
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;