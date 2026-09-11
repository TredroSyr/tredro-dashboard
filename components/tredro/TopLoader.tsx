"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";

const TRICKLE_INTERVAL_MS = 200;
const AUTO_DONE_TIMEOUT_MS = 6000;
const HIDE_DELAY_MS = 300;

/**
 * Web-only top progress bar for route navigations.
 *
 * Skipped inside the Capacitor app: native navigations are instant enough
 * that the bar would just flash, and it fights with the native WebView chrome.
 */
export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickleTimerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const clearTimers = () => {
      if (trickleTimerRef.current) {
        window.clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;
      }
      if (doneTimerRef.current) {
        window.clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const done = () => {
      clearTimers();
      setProgress(100);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, HIDE_DELAY_MS);
    };

    const start = () => {
      clearTimers();
      setVisible(true);
      setProgress(12);

      trickleTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const step = prev < 60 ? 8 : prev < 80 ? 3 : 1;
          return Math.min(prev + step, 90);
        });
      }, TRICKLE_INTERVAL_MS);

      doneTimerRef.current = window.setTimeout(done, AUTO_DONE_TIMEOUT_MS);
    };

    const isInternalAnchor = (anchor: HTMLAnchorElement) => {
      if (anchor.target === "_blank") return false;
      if (anchor.hasAttribute("download")) return false;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return false;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

      try {
        const url = new URL(anchor.href, window.location.href);
        return (
          url.origin === window.location.origin &&
          url.href !== window.location.href
        );
      } catch {
        return false;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as HTMLElement)?.closest?.(
        "a[href]"
      ) as HTMLAnchorElement | null;

      if (anchor && isInternalAnchor(anchor)) start();
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history
    );

    // Deferred so `start()`'s setState calls never run inside whatever
    // phase (e.g. a library's useInsertionEffect) triggered the history
    // change — React forbids scheduling updates from insertion effects.
    window.history.pushState = ((...args) => {
      window.setTimeout(start, 0);
      return originalPushState(...args);
    }) as typeof window.history.pushState;

    window.history.replaceState = ((...args) => {
      window.setTimeout(start, 0);
      return originalReplaceState(...args);
    }) as typeof window.history.replaceState;

    (window as typeof window & { __topLoaderDone?: () => void }).__topLoaderDone =
      done;

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    (
      window as typeof window & { __topLoaderDone?: () => void }
    ).__topLoaderDone?.();
  }, [pathname, searchParams]);

  if (Capacitor.isNativePlatform()) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full rounded-r-full shadow-[0_0_10px_var(--primary)] transition-[width] duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, var(--primary) 0%, color-mix(in oklch, var(--primary), white 45%) 100%)",
        }}
      />
    </div>
  );
}
