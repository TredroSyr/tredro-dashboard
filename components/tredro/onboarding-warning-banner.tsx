"use client";

import { X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useAuthStore } from "@/module/auth/store/auth-store";
import { useBannerStore } from "@/store/use-banner-store";

export function OnboardingWarningBanner() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { dismiss, shouldShow } = useBannerStore();

  const onboardingCompleted = user?.company?.onboarding_completed;
  const showBanner = !onboardingCompleted && shouldShow();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismiss();
  };

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={handleGoToProfile}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleGoToProfile();
            }
          }}
          className="relative m-2 cursor-pointer rounded-lg border border-warning/30 bg-warning/10 transition-colors hover:bg-warning/15"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="px-4 py-3"
          >
            <div className="flex items-start gap-3 pl-8">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mt-0.5 flex-shrink-0"
              >
                <AlertTriangle className="h-5 w-5 text-warning" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-warning-foreground">
                  لم يتم إكمال ملفك الشخصي بعد
                </p>
                <p className="text-[13px] text-warning-foreground/80">
                  يرجى استكمال البيانات لتسهيل التواصل مع المحلات وتحسين ظهور
                  شركتك.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="absolute left-3 top-3 rounded-lg p-1 hover:bg-warning/20"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4 text-warning" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
