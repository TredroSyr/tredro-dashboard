"use client";

import { Badge } from "@/components/ui/badge";
import type { CustomerRequestStatus } from "../types";
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from "../lib/format";

export function RequestStatusBadge({ status }: { status: CustomerRequestStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
