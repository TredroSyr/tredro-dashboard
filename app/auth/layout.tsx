import Footer from "@/module/auth/components/footer";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const layout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-6">
        <Link href="/home" className="flex items-center">
          <Image
            src="/rebbit/logo.svg"
            alt="Tredro Logo"
            width={80}
            height={40}
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
