"use client";

import { useAuthRedirect } from "@/components/provider/AuthRedirector";

type RequireOnboardingProps = {
  children: React.ReactNode;
};

const RequireOnboarding = ({ children }: RequireOnboardingProps) => {
  const { shouldRender } = useAuthRedirect("require-onboarding");

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
};

export default RequireOnboarding;
