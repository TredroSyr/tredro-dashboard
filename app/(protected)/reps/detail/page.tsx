"use client";
import { useSearchParams } from "next/navigation";
import { RepDetailClient } from "@/module/reps/_components/rep-detail-client";
import { PermissionGate } from "@/components/tredro/PermissionGate";

export default function RepDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <PermissionGate module="reps">
      <RepDetailClient repId={id} />
    </PermissionGate>
  );
}