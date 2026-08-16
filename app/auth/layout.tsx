import Footer from "@/module/auth/components/footer";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const layout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/home" className="flex items-center">
          <Image
            src="/tredro/full_logo.svg"
            alt="Tredro Logo"
            width={160}
            height={80}
            className="cursor-pointer"
          />
        </Link>
      </div>

      <main className="flex-1">{children}</main>
      {/* 
      <Footer /> */}
    </div>
  );
};

export default layout;
