"use client";

import { Moon, Sun } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useThemeStore } from "@/store/use-theme-store";

export const ThemeToggle = ({ onAction }: { onAction: () => void }) => {
  const { theme, toggleTheme, hasHydrated } = useThemeStore();
  const isDark = hasHydrated && theme === "dark";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={isDark ? "الوضع النهاري" : "الوضع الليلي"}
        onClick={() => {
          toggleTheme();
          onAction();
        }}
        className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:bg-muted active:scale-[0.97]"
      >
        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <Sun
            className={`absolute h-4 w-4 text-primary transition-all duration-300 ${
              isDark
                ? "-rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <Moon
            className={`absolute h-4 w-4 text-primary transition-all duration-300 ${
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0"
            }`}
          />
        </span>
        <span className="truncate">
          {isDark ? "الوضع الليلي" : "الوضع النهاري"}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
