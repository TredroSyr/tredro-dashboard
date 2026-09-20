import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  getLocations,
  getBusinessTypes,
  submitOnboarding,
} from "../api/onboarding";
import {
  OnboardingPayload,
  OnboardingResponseData,
  ApiSuccessResponse,
} from "../types/onboarding";
import { ApiErrorResponse } from "../types";

export const useLocationsQuery = () =>
  useQuery({
    queryKey: ["companies", "locations"],
    queryFn: getLocations,
    staleTime: Infinity,
  });

export const useBusinessTypesQuery = () =>
  useQuery({
    queryKey: ["companies", "business-types"],
    queryFn: getBusinessTypes,
    staleTime: Infinity,
  });

export const useOnboardingMutation = (options?: {
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
  onSuccess?: (response: ApiSuccessResponse<OnboardingResponseData>) => void;
  skipRedirect?: boolean;
}) => {
  const router = useRouter();

  return useMutation({
    mutationKey: ["onboarding", "submit"],
    mutationFn: (payload: OnboardingPayload) => submitOnboarding(payload),
    onSuccess: (response) => {
      if (response?.success) {
        // Call custom onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(response);
        }

        toast.success(response.message || "تم حفظ البيانات بنجاح!");

        // Only redirect if not skipped
        if (!options?.skipRedirect) {
          router.push("/");
        }
      } else {
        toast.error(response?.message || "حدث خطأ أثناء الإعداد");
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.response?.data?.message || "حدث خطأ غير متوقع");
      }
    },
  });
};
