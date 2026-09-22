"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useUnregisterNotificationDeviceMutation } from "@/module/notifications/hooks";
import { FCM_TOKEN_STORAGE_KEY } from "@/module/notifications/hooks/use-register-push-notifications";

export const LogoutMenuItem = ({ onAction }: { onAction: () => void }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { mutate: unregisterDevice } =
    useUnregisterNotificationDeviceMutation();
  const [open, setOpen] = useState(false);

  const handleConfirmLogout = () => {
    const toastId = toast.loading("جاري تسجيل الخروج...");

    setOpen(false);
    onAction();

    // This device's push token belongs to whoever is signed in on it (backend
    // §4.3) — unregister it now, and clear the dedup cache so the next sign-in
    // (possibly a different user) always re-registers instead of assuming
    // "same token = already registered".
    const fcmToken = window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (fcmToken) {
      unregisterDevice(fcmToken);
      window.localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    }

    // Let the loading toast paint before we tear things down and navigate away
    setTimeout(() => {
      clearAuth();

      // Wipe all cached queries so no stale/previous-user data lingers
      queryClient.clear();

      router.push("/auth/login");
      toast.close(toastId);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="تسجيل الخروج"
          onClick={() => setOpen(true)}
          className="cursor-pointer text-destructive transition-all duration-200 hover:translate-x-1 hover:bg-destructive/10 hover:text-destructive active:scale-[0.97]"
        >
          <IconRenderer
            name="logout_outlined"
            className="h-4 w-4 shrink-0 text-destructive"
          />
          <span className="truncate">تسجيل الخروج</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>تسجيل الخروج</DialogTitle>
          <DialogDescription>هل انت متاكد من تسجيل الخروج</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleConfirmLogout}>
            تسجيل الخروج
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
