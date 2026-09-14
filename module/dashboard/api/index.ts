import api from "@/lib/axios";
import { CompanyOverviewParams, CompanyOverviewResponse } from "../types";

export const getCompanyOverview = async (
  params?: CompanyOverviewParams,
): Promise<CompanyOverviewResponse> =>
  (await api.get("companies/overview/", { params })).data;
