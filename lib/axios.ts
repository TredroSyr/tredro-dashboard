import { refreshAccessToken } from "@/module/auth/lib/auth";
import { useAuthStore } from "@/module/auth/store/auth-store";
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
};

const AUTH_SKIP_URLS = [
  "/auth/company/signup",
  "/auth/token/refresh",
  "/auth/company/signin",
];

let isRefreshing = false;
let failedRequestQueue: FailedRequest[] = [];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const processQueue = (error: unknown, token: string | null = null) => {
  failedRequestQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      if (prom.config.headers) {
        prom.config.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(api(prom.config));
    }
  });
  failedRequestQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthUrl = AUTH_SKIP_URLS.some((u) =>
      originalRequest.url?.includes(u),
    );
    const is401 = error.response?.status === 401;

    if (is401 && !originalRequest._retry && !isAuthUrl) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Token is already being refreshed - queue this request
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.ok) {
          // Update the current request's header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          }
          // Process all queued requests with the new token
          processQueue(null, refreshResult.token);
          // Retry the current request
          return api(originalRequest);
        } else {
          // Refresh failed - reject all queued requests
          processQueue(error);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh threw an error - reject all queued requests
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
