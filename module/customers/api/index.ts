import api from "@/lib/axios";
import {
  CustomersListResponse,
  CustomerResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
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
