import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

/** Normalized shape both the native and web paths reduce down to, so the rest of the app handles push in one standard way. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushHandlers {
  onToken: (token: string) => void;
  /** Notification arrived while the app/tab was open and visible. */
  onForegroundNotification: (payload: PushPayload) => void;
  /** User tapped a notification (from the OS tray, on native, or from the service worker on web). */
  onNotificationTap: (payload: PushPayload) => void;
}

const registerNative = async (handlers: PushHandlers) => {
  console.log("🔔 [push] native platform detected, requesting permission...");
  const permission = await PushNotifications.requestPermissions();
  console.log("🔔 [push] native permission result:", permission);
  if (permission.receive !== "granted") {
    console.warn("⚠️ [push] native permission not granted, aborting");
    return;
  }

  await PushNotifications.addListener("registration", (token) => {
    console.log("✅ [push] native FCM token received:", token.value);
    handlers.onToken(token.value);
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ [push] native registration error:", error);
  });

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    handlers.onForegroundNotification({
      title: notification.title || "Tredro",
      body: notification.body || "",
      url: notification.data?.url,
    });
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const { notification } = action;
    handlers.onNotificationTap({
      title: notification.title || "Tredro",
      body: notification.body || "",
      url: notification.data?.url,
    });
  });

  await PushNotifications.register();
  console.log("🔔 [push] native register() called");
};

const registerWeb = async (handlers: PushHandlers) => {
  console.log("🔔 [push] web platform detected, starting registration...");

  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("⚠️ [push] Notification API not available in this browser");
    return;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn(
      "⚠️ [push] firebase messaging is not supported in this browser/webview",
    );
    return;
  }
  console.log("🔔 [push] firebase messaging initialized");

  const permission = await Notification.requestPermission();
  console.log("🔔 [push] web notification permission result:", permission);
  if (permission !== "granted") {
    console.warn("⚠️ [push] web permission not granted, aborting");
    return;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn(
      "⚠️ [push] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set — web push disabled",
    );
    return;
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  console.log(
    "🔔 [push] service worker registered, scope:",
    registration.scope,
  );

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    console.log("✅ [push] web FCM token received:", token);
    handlers.onToken(token);
  } else {
    console.warn("⚠️ [push] getToken() returned no token");
  }

  // Fires only while this tab is open/focused — background messages are handled
  // by the service worker (see public/firebase-messaging-sw.js) instead.
  onMessage(messaging, (payload) => {
    handlers.onForegroundNotification({
      title: payload.notification?.title || "Tredro",
      body: payload.notification?.body || "",
      url: payload.data?.url,
    });
  });

  // The service worker posts this when the user clicks a notification it showed
  // in the background (see the `notificationclick` handler there).
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "notification-click") return;
    handlers.onNotificationTap({
      title: event.data.title || "Tredro",
      body: event.data.body || "",
      url: event.data.url,
    });
  });
};

/** Requests permission and registers for push on whichever platform we're running on. */
export const registerForPushNotifications = async (handlers: PushHandlers) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await registerNative(handlers);
    } else {
      await registerWeb(handlers);
    }
  } catch (error) {
    console.error("❌ [push] registration threw an error:", error);
  }
};
