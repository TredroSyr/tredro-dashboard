"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useRegisterFcmTokenMutation } from "./index";
import {
  registerForPushNotifications,
  PushPayload,
} from "../lib/push-notifications";
import { playNotificationSound } from "../lib/notification-sound";

/** Registers for push notifications once and sends the resulting token to the backend. */
export const useRegisterPushNotifications = (enabled: boolean) => {
  const { mutate: sendToken } = useRegisterFcmTokenMutation();
  const router = useRouter();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!enabled) {
      console.log("🔔 [push] not enabled yet (user not authenticated)");
      return;
    }
    if (hasRegistered.current) return;
    hasRegistered.current = true;

    console.log("🔔 [push] user authenticated, starting push registration");

    const showNotificationToast = (payload: PushPayload) => {
      playNotificationSound();
      toast.info(payload.title, {
        description: payload.body,
        timeout: 6000,
        actionProps: {
          children: "عرض",
          onClick: () => router.push(payload.url || "/notifications"),
        },
      });
    };

    registerForPushNotifications({
      onToken: (token) => {
        sendToken(token, {
          onSuccess: () => console.log("✅ [push] token sent to /fcm-token/"),
          onError: (error) =>
            console.error("❌ [push] failed to send token to backend:", error),
        });
      },
      onForegroundNotification: (payload) => {
        console.log("📩 [push] foreground notification:", payload);
        showNotificationToast(payload);
      },
      onNotificationTap: (payload) => {
        console.log("👆 [push] notification tapped:", payload);
        router.push(payload.url || "/notifications");
      },
    });
  }, [enabled, sendToken, router]);
};
