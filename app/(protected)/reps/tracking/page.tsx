"use client";

import { PermissionGate } from "@/components/tredro/PermissionGate";
import { RepsLiveView } from "@/module/tracking/components/reps-live-view";

export default function RepsTrackingPage() {
  return (
    <PermissionGate module="reps">
      <RepsLiveView />
    </PermissionGate>
  );
}
