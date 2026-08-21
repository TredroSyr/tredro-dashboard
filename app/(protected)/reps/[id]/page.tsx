// app/(protected)/reps/[id]/page.tsx
// Server Component — no "use client" here

import { RepDetailClient } from "@/module/reps/_components/rep-detail-client";

export async function generateStaticParams() {
  // TODO: replace with real rep IDs from your API/DB at build time
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function RepDetailPage({ params }: { params: { id: string } }) {
  return <RepDetailClient repId={params.id} />;
}
