"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const MobileTopBar = ({ onRefresh }: { onRefresh?: () => void }) => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <SidebarTrigger className="cursor-pointer transition-transform duration-200 hover:scale-110" />
      <button type="button" onClick={onRefresh}>
        <Image
          src="/tredro/full_logo.svg"
          alt="logo"
          width={100}
          height={50}
          className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        />
      </button>
    </div>
  );
};
