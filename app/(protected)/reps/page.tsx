"use client";

import RepsView from "@/module/reps/_components/reps-view";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function RepsPage() {
  return (
    <PermissionGate module="reps">
      <RepsView />
    </PermissionGate>
  );
}
