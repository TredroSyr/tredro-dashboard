import api from "@/lib/axios";
import {
  ApiSuccessResponse,
  BusinessType,
  GovernorateLocation,
  OnboardingPayload,
} from "../types/onboarding";

export const getLocations = async (): Promise<GovernorateLocation[]> => {
  const response = await api.get<
    ApiSuccessResponse<{ locations: GovernorateLocation[] }>
  >("/companies/locations");
  return response.data.data.locations;
};

export const getBusinessTypes = async (): Promise<BusinessType[]> => {
  const response = await api.get<
    ApiSuccessResponse<{ business_types: BusinessType[] }>
  >("/companies/business-types");
  return response.data.data.business_types;
};

export const submitOnboarding = async (
  payload: OnboardingPayload,
): Promise<ApiSuccessResponse<{ company: unknown }>> => {
  const formData = new FormData();

  if (payload.logo) formData.append("logo", payload.logo);
  if (payload.cover) formData.append("cover", payload.cover);
  if (payload.governorate) formData.append("governorate", payload.governorate);
  if (payload.region) formData.append("region", payload.region);
  if (payload.description) formData.append("description", payload.description);
  if (payload.business_type)
    formData.append("business_type", payload.business_type);

  // Don't set Content-Type manually — let axios/browser set the multipart boundary
  const response = await api.post("/companies/onboarding", formData);
  return response.data;
};
