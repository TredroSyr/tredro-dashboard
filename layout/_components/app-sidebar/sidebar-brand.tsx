"use client";

import Image from "next/image";
import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";

export const SidebarBrand = ({ onRefresh }: { onRefresh?: () => void }) => {
  return (
    <SidebarHeader className="px-2 py-4">
      <div className="flex items-center justify-between gap-2 group-data-[state=expanded]:flex-row-reverse group-data-[collapsible=icon]:flex-col-reverse group-data-[collapsible=icon]:items-center lg:justify-center">
        <SidebarTrigger className="hidden shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110 md:flex lg:hidden" />

        <button
          type="button"
          onClick={onRefresh}
          className="hidden group-data-[state=expanded]:block"
        >
          <Image
            src="/tredro/full_logo.svg"
            alt="logo"
            width={140}
            height={70}
            className="h-auto w-[140px] cursor-pointer object-contain transition-all duration-200 hover:scale-105 active:scale-95"
          />
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="hidden group-data-[collapsible=icon]:block"
        >
          <Image
            src="/tredro/logo.svg"
            alt="logo"
            width={32}
            height={32}
            className="h-auto w-8 cursor-pointer object-contain transition-all duration-200 hover:scale-110 active:scale-95"
          />
        </button>
      </div>
    </SidebarHeader>
  );
};
