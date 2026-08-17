"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/module/auth/store/auth-store";

type Mode = "guest-only" | "require-auth" | "require-onboarding";

export const useAuthRedirect = (mode: Mode) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  console.log({ user });
  const onboardingCompleted = !!user?.company?.onboarding_completed;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (mode === "guest-only" && isAuthenticated) {
      router.replace("/");
    }

    if (mode === "require-auth" && !isAuthenticated) {
      router.replace("/auth/login");
    }

    if (mode === "require-onboarding") {
      if (!isAuthenticated) {
        router.replace("/auth/login");
      } else if (onboardingCompleted) {
        router.replace("/home");
      }
    }
  }, [mounted, isAuthenticated, onboardingCompleted, mode, router]);

  const shouldRender =
    mounted &&
    ((mode === "guest-only" && !isAuthenticated) ||
      (mode === "require-auth" && isAuthenticated) ||
      (mode === "require-onboarding" &&
        isAuthenticated &&
        !onboardingCompleted));

  return { mounted, isAuthenticated, shouldRender };
};
