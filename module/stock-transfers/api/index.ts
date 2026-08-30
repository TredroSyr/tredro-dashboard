import api from "@/lib/axios";
import {
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
