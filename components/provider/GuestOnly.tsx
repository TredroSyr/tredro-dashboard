"use client";

import { useAuthRedirect } from "./AuthRedirector";

type GuestOnlyProps = {
  children: React.ReactNode;
};

const GuestOnly = ({ children }: GuestOnlyProps) => {
  const { shouldRender } = useAuthRedirect("guest-only");

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
};

export default GuestOnly;
