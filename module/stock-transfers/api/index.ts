import api from "@/lib/axios";
import {
  CreateStockTransferPayload,
  HistoryResponse,
  ListStockTransfersParams,
  ModifyStockTransferPayload,
  StockTransferResponse,
  StockTransfersListResponse,
} from "../types";

export const listStockTransfers = async (
  params?: ListStockTransfersParams,
): Promise<StockTransfersListResponse> =>
  (await api.get("companies/stock-transfers/", { params })).data;

/** Dispatch — office sends goods a rep never requested. Enters at `confirmed`, no idempotency key (frontend4.md §6d). */
export const createStockTransfer = async (
  payload: CreateStockTransferPayload,
): Promise<StockTransferResponse> =>
  (await api.post("companies/stock-transfers/", payload)).data;

export const getStockTransfer = async (
  id: number | string,
): Promise<StockTransferResponse> =>
  (await api.get(`companies/stock-transfers/${id}/`)).data;

export const approveStockTransfer = async (
  id: number | string,
): Promise<StockTransferResponse> =>
  (await api.post(`companies/stock-transfers/${id}/approve/`)).data;

export const modifyStockTransfer = async (
  id: number | string,
  payload: ModifyStockTransferPayload,
): Promise<StockTransferResponse> =>
  (await api.post(`companies/stock-transfers/${id}/modify/`, payload)).data;

export const cancelStockTransfer = async (
  id: number | string,
): Promise<StockTransferResponse> =>
  (await api.post(`companies/stock-transfers/${id}/cancel/`)).data;

export const getStockTransferHistory = async (
  id: number | string,
): Promise<HistoryResponse> =>
  (await api.get(`companies/stock-transfers/${id}/history/`)).data;
