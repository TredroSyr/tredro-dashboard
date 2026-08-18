import api from "@/lib/axios";
import {
  ModulesResponse,
  SubUsersListResponse,
  CreateSubUserPayload,
  CreateSubUserResponse,
  UpdateSubUserPayload,
  UpdateSubUserResponse,
  ApiEnvelope,
} from "../types";

// GET companies/modules
export const getModules = async (): Promise<ModulesResponse> => {
  const response = await api.get<ModulesResponse>("companies/modules");
  return response.data;
};

// GET companies/subusers/list
export const listSubUsers = async (): Promise<SubUsersListResponse> => {
  const response = await api.get<SubUsersListResponse>(
    "companies/subusers/list",
  );
  return response.data;
};

// POST companies/subusers
export const createSubUser = async (
  payload: CreateSubUserPayload,
): Promise<CreateSubUserResponse> => {
  const response = await api.post<CreateSubUserResponse>(
    "companies/subusers",
    payload,
  );
  return response.data;
};

// NOTE: not present in the API doc — assumed REST convention.
// Swap the paths below once the real endpoints are confirmed.
export const updateSubUser = async (
  payload: UpdateSubUserPayload,
): Promise<UpdateSubUserResponse> => {
  const { id, ...body } = payload;
  const response = await api.patch<UpdateSubUserResponse>(
    `companies/subusers/${id}`,
    body,
  );
  return response.data;
};

// NOTE: assumed — not documented.
export const deleteSubUser = async (id: number): Promise<ApiEnvelope<null>> => {
  const response = await api.delete<ApiEnvelope<null>>(
    `companies/subusers/${id}`,
  );
  return response.data;
};
