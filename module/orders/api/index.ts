import api from "@/lib/axios";
import {
  CustomerRequestResponse,
  CustomerRequestsListResponse,
  ListCustomerRequestsParams,
} from "../types";

// Read-only: POST/PATCH/DELETE on this router return 405. There is nothing to
// mutate here from the dashboard except the customer's rep assignment, which
// lives on the customers endpoints (see module/customers).
export const listCustomerRequests = async (
  params?: ListCustomerRequestsParams,
): Promise<CustomerRequestsListResponse> => {
  const response = await api.get<CustomerRequestsListResponse>(
    "companies/customer-requests/",
    { params },
  );
  return response.data;
};

export const getCustomerRequest = async (
  id: number | string,
): Promise<CustomerRequestResponse> => {
  const response = await api.get<CustomerRequestResponse>(
    `companies/customer-requests/${id}/`,
  );
  return response.data;
};
