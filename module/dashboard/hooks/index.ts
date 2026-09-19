"use client";
import { useQuery } from "@tanstack/react-query";
import { getCompanyInsights, getCompanyOverview } from "../api";
import { CompanyOverviewParams, InsightsParams } from "../types";

export const useCompanyOverviewQuery = (params?: CompanyOverviewParams) =>
  useQuery({
    queryKey: ["dashboard", "overview", params],
    queryFn: () => getCompanyOverview(params),
  });

// Insights are a bonus on top of the cards — no retries, the card just hides on failure.
export const useCompanyInsightsQuery = (params?: InsightsParams) =>
  useQuery({
    queryKey: ["dashboard", "insights", params],
    queryFn: () => getCompanyInsights(params),
    retry: false,
  });
