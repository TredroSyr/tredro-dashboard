"use client";
import { useSearchParams } from "next/navigation";
import { RepDetailClient } from "@/module/reps/_components/rep-detail-client";

export default function RepDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return <RepDetailClient repId={id} />;
}