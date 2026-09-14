"use client";
import { useQuery } from "@tanstack/react-query";
import { getCompanyOverview } from "../api";
import { CompanyOverviewParams } from "../types";

export const useCompanyOverviewQuery = (params?: CompanyOverviewParams) =>
  useQuery({
    queryKey: ["dashboard", "overview", params],
    queryFn: () => getCompanyOverview(params),
  });
