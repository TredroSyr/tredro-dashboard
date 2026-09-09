import api from "@/lib/axios";
import { RegisterFcmTokenResponse } from "../types";

export const registerFcmToken = async (
  token: string,
): Promise<RegisterFcmTokenResponse> =>
  (await api.post("fcm-token/", { token })).data;
