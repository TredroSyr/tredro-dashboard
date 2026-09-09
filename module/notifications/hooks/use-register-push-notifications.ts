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

const FCM_TOKEN_STORAGE_KEY = "fcm_token";

// Dedup concurrent registrations (StrictMode double-effect in dev).
let registrationInFlight = false;

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
    if (hasRegistered.current || registrationInFlight) return;
    hasRegistered.current = true;
    registrationInFlight = true;

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

      // If the tab isn't actually visible (open in a background tab), the
      // in-page toast above won't be seen — fall back to a real OS notification.
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible" &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(payload.title, { body: payload.body });
        } catch (error) {
          console.warn("⚠️ [push] OS notification fallback failed:", error);
        }
      }
    };

    registerForPushNotifications({
      onToken: (token) => {
        const lastSent =
          typeof window !== "undefined"
            ? window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
            : null;

        if (lastSent === token) {
          console.log("🔔 [push] token unchanged since last send, skipping POST");
          registrationInFlight = false;
          return;
        }

        sendToken(token, {
          onSuccess: () => {
            console.log("✅ [push] token sent to /fcm-token/");
            window.localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
            registrationInFlight = false;
          },
          onError: (error) => {
            console.error("❌ [push] failed to send token to backend:", error);
            registrationInFlight = false;
          },
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
    }).finally(() => {
      // Safety net for paths that never call onToken (denied permission,
      // unsupported browser, etc.) — otherwise registrationInFlight would
      // stay stuck true and block every future attempt.
      registrationInFlight = false;
    });
  }, [enabled, sendToken, router]);
};
