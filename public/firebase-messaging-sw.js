// Handles push notifications while the web app is not in the foreground.
// This file is served as a static asset — it can't read Next.js env vars,
// so the Firebase config below must be kept in sync with lib/firebase.ts.
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyA4QUDwuGp8gqUb4IpqCF-JhZlA6M5JpDM",
  authDomain: "tredro-70442.firebaseapp.com",
  projectId: "tredro-70442",
  storageBucket: "tredro-70442.firebasestorage.app",
  messagingSenderId: "449012214500",
  appId: "1:449012214500:web:8eb8250302d1c599d21af1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 [push-sw] background message:", payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Tredro", {
    body,
    icon: icon || "/tredro/logo.svg",
    data: payload.data || {},
  });
});

// Tells the open app tab (if any) which URL to navigate to, so the click is
// handled the same standard way as a foreground notification tap.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const client = allClients[0];
      if (client) {
        client.postMessage({
          type: "notification-click",
          title: event.notification.title,
          body: event.notification.body,
          url,
        });
        client.focus();
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
