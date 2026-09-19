import api from "@/lib/axios";
import {
  CompanyOverviewParams,
  CompanyOverviewResponse,
  InsightsParams,
  InsightsResponse,
} from "../types";

export const getCompanyOverview = async (
  params?: CompanyOverviewParams,
): Promise<CompanyOverviewResponse> =>
  (await api.get("companies/overview/", { params })).data;

/** The AI provider can be slow on the first request for new figures; the server gives up on it well before this. */
export const INSIGHTS_TIMEOUT = 25_000;

/** Every overview screen has an `…/insights/` sibling. `overviewPath` is that overview's own path, trailing slash included. */
export const getInsights = async (
  overviewPath: string,
  params?: InsightsParams,
): Promise<InsightsResponse> =>
  (await api.get(`${overviewPath}insights/`, { params, timeout: INSIGHTS_TIMEOUT })).data;

export const getCompanyInsights = (params?: InsightsParams) =>
  getInsights("companies/overview/", params);
