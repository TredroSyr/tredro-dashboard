import api from "@/lib/axios";
import {
  RepsListResponse,
  RepResponse,
  CreateRepPayload,
  UpdateRepPayload,
  ApiEnvelope,
} from "../types";

export const listReps = async (): Promise<RepsListResponse> => {
  const response = await api.get<RepsListResponse>("companies/reps/");
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
