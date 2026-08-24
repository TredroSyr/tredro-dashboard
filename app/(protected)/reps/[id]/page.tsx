// app/(protected)/reps/[id]/page.tsx
// Server Component — no "use client" here

import { RepDetailClient } from "@/module/reps/_components/rep-detail-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `تفاصيل المندوب #${id}`,
    description: "عرض تفاصيل المندوب والزبائن المسندين له",
  };
}

export default async function RepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RepDetailClient repId={id} />;
}
