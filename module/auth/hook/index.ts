import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
  ApiErrorResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types";
import { useAuthStore } from "../store/auth-store";
import { login, register } from "../api";
import { toast } from "sonner";

export const useLoginMutation = (options?: {
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["login"],
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (response) => {
      if (response?.success && response.data?.tokens) {
        setAuth(response.data.user, response.data.tokens);
        console.log({ response });
        if (!response.data.user.company.onboarding_completed) {
          console.log("SAFWAT");
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else {
        toast.error(response?.message || "فشل تسجيل الدخول");
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "فشل تسجيل الدخول");
      }
    },
  });
};

export const useRegisterMutation = (options?: {
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationKey: ["register"],
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: (response) => {
      if (response?.success && response.data?.tokens) {
        setAuth(response.data.user, response.data.tokens);
        toast.success(response.message || "تم إنشاء الحساب بنجاح!");
        router.push("/onboarding");
      } else {
        toast.error(response?.message || "فشل حفظ بيانات المستخدم");
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "فشل التسجيل");
      }
    },
  });
};
