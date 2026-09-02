"use client";

import { motion } from "framer-motion";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { useRefresh } from "@/components/provider/RefreshProvider";

interface RefreshIndicatorProps {
  isRefreshing?: boolean;
}

/**
 * Top refresh indicator shown during pull-to-refresh or programmatic refresh.
 * Uses useRefresh() context if isRefreshing is not explicitly provided.
 */
export function RefreshIndicator({ isRefreshing: explicitIsRefreshing }: RefreshIndicatorProps) {
  const refreshContext = useRefresh();
  const isRefreshing = explicitIsRefreshing ?? refreshContext.isRefreshing;

  if (!isRefreshing) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-2">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary shadow-lg"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
        >
          <IconRenderer name="refresh_outlined" className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </div>
  );
}
