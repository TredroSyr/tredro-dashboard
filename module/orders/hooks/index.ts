"use client";
import { useQuery } from "@tanstack/react-query";
import { getCustomerRequest, listCustomerRequests } from "../api";
import { ListCustomerRequestsParams } from "../types";

export const useCustomerRequestsQuery = (params?: ListCustomerRequestsParams) =>
  useQuery({
    queryKey: ["customerRequests", "list", params],
    queryFn: () => listCustomerRequests(params),
  });

export const useCustomerRequestQuery = (
  id?: string | number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["customerRequests", "detail", id !== undefined ? String(id) : id],
    queryFn: () => {
      if (!id) throw new Error("getCustomerRequest called without id");
      return getCustomerRequest(id);
    },
    enabled: (options?.enabled ?? true) && Boolean(id),
  });
