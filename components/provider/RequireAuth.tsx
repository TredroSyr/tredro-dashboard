"use client";

import { useAuthRedirect } from "./AuthRedirector";

type RequireAuthProps = {
  children: React.ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { shouldRender } = useAuthRedirect("require-auth");

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
