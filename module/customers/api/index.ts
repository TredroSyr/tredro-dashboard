import api from "@/lib/axios";
import {
  CustomersListResponse,
  CustomerResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  AssignRepsPayload,
  RemoveRepsPayload,
  ImportExcelResponse,
  ApiEnvelope,
} from "../types";

export const listCustomers = async (): Promise<CustomersListResponse> => {
  const response = await api.get<CustomersListResponse>("companies/customers/");
  return response.data;
};

export const getCustomer = async (
  id: number | string,
): Promise<CustomerResponse> => {
  const response = await api.get<CustomerResponse>(`companies/customers/${id}`);
  return response.data;
};

export const createCustomer = async (
  payload: CreateCustomerPayload,
): Promise<CustomerResponse> => {
  const response = await api.post<CustomerResponse>(
    "companies/customers/",
    payload,
  );
  return response.data;
};

export const updateCustomer = async (
  payload: UpdateCustomerPayload,
): Promise<CustomerResponse> => {
  const { id, ...body } = payload;
  const response = await api.patch<CustomerResponse>(
    `companies/customers/${id}/`,
    body,
  );
  return response.data;
};

export const deactivateCustomer = async (
  id: number,
): Promise<ApiEnvelope<null>> => {
  const response = await api.delete<ApiEnvelope<null>>(
    `companies/customers/${id}/`,
  );
  return response.data;
};

export const assignRepsToCustomer = async (
  payload: AssignRepsPayload,
): Promise<CustomerResponse> => {
  const response = await api.post<CustomerResponse>(
    `companies/customers/${payload.id}/assign-reps/`,
    { rep_ids: payload.rep_ids },
  );
  return response.data;
};

export const removeRepsFromCustomer = async (
  payload: RemoveRepsPayload,
): Promise<CustomerResponse> => {
  const response = await api.post<CustomerResponse>(
    `companies/customers/${payload.id}/remove-reps/`,
    payload.rep_ids ? { rep_ids: payload.rep_ids } : {},
  );
  return response.data;
};

export const downloadCustomersTemplate = async (): Promise<Blob> => {
  const response = await api.get("companies/customers/download-template/", {
    responseType: "blob",
  });
  return response.data;
};

export const importCustomersExcel = async (
  file: File,
): Promise<ImportExcelResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ImportExcelResponse>(
    "companies/customers/import-excel/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};
