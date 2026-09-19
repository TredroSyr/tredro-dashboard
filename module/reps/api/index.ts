import api from "@/lib/axios";
import { getInsights } from "@/module/dashboard/api";
import type { InsightsParams } from "@/module/dashboard/types";
import {
  RepsListResponse,
  RepResponse,
  CreateRepPayload,
  UpdateRepPayload,
  ApiEnvelope,
  RepOverviewParams,
  RepOverviewResponse,
} from "../types";

export const listReps = async (customerId?: string | number): Promise<RepsListResponse> => {
  const params = customerId ? { customer_id: customerId } : {};
  const response = await api.get<RepsListResponse>("companies/reps/", { params });
  return response.data;
};

export const getRep = async (id: number | string): Promise<RepResponse> => {
  const response = await api.get<RepResponse>(`companies/reps/${id}/`);
  return response.data;
};

export const createRep = async (
  payload: CreateRepPayload,
): Promise<RepResponse> => {
  const response = await api.post<RepResponse>("companies/reps/", payload);
  return response.data;
};

export const updateRep = async (
  payload: UpdateRepPayload,
): Promise<RepResponse> => {
  const { id, ...body } = payload;
  const response = await api.patch<RepResponse>(`companies/reps/${id}/`, body);
  return response.data;
};

export const deleteRep = async (id: number): Promise<ApiEnvelope<null>> => {
  const response = await api.delete<ApiEnvelope<null>>(`companies/reps/${id}/`);
  return response.data;
};

export const getRepOverview = async (
  id: number | string,
  params?: RepOverviewParams,
): Promise<RepOverviewResponse> => {
  const response = await api.get<RepOverviewResponse>(
    `companies/reps/${id}/overview/`,
    { params },
  );
  return response.data;
};

export const getRepInsights = (id: number | string, params?: InsightsParams) =>
  getInsights(`companies/reps/${id}/overview/`, params);
