"use client";
import { useMutation } from "@tanstack/react-query";
import { registerFcmToken } from "../api";

export const useRegisterFcmTokenMutation = () =>
  useMutation({
    mutationFn: (token: string) => registerFcmToken(token),
  });
