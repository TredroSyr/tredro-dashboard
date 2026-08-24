"use client";
import { useSearchParams } from "next/navigation";
import { CustomerDetailClient } from "@/module/customers/_components/customer-detail-client";

export default function CustomerDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return <CustomerDetailClient customerId={id} />;
}