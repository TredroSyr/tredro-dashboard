export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type RegisterFcmTokenResponse = ApiEnvelope<null>;

export type NotificationKind = "order" | "invoice" | "stock_transfer" | "system";

export interface NotificationItem {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
}
