import GuestOnly from "@/components/provider/GuestOnly";
import { ProtectedRoute } from "@/guards/protected-route";
import { PublicRoute } from "@/guards/public-route";

import Image from "next/image";
import React from "react";
type AuthLayoutProps = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <PublicRoute>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <Image
            src="/tredro/full_logo.svg"
            alt="Tredro Logo"
            width={160}
            height={80}
            className="cursor-pointer"
          />
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </PublicRoute>
  );
};

export default AuthLayout;
