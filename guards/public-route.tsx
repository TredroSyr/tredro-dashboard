"use client";

import { useAuthStore } from "@/module/auth/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  // Onboarding is the owner's job. Staff never need the auth screens once
  // signed in, whether or not the company profile is finished.
  const shouldLeaveAuthPages = useAuthStore(
    (state) =>
      !!state.user &&
      (!state.user.is_owner || !!state.user.company?.onboarding_completed),
  );
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  const shouldRedirect = isAuthenticated && shouldLeaveAuthPages;

  useEffect(() => {
    if (shouldRedirect && isMounted) {
      router.push("/");
    }
  }, [shouldRedirect, isMounted, router]);

  if (!isMounted) {
    return null;
  }

  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};
