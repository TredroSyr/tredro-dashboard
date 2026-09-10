import { refreshAccessToken } from "@/module/auth/lib/auth";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { playActionErrorSound, playActionSuccessSound } from "@/lib/action-sound";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

// Methods that represent a user-initiated create/update/delete action.
// Only these get a success/fail sound — GET requests (page loads, polling,
// react-query refetches) fire far too often to play a sound for.
const MUTATING_METHODS = ["post", "put", "patch", "delete"];

// Endpoints that are technically mutating but happen passively/in the
// background (e.g. marking a notification read as soon as it's opened) —
// not a deliberate user action, so they shouldn't get a sound either.
const SILENT_URL_PATTERNS = [/notifications\/.*read/i];

const isMutatingRequest = (method?: string) =>
  !!method && MUTATING_METHODS.includes(method.toLowerCase());

const shouldPlaySound = (method?: string, url?: string) =>
  isMutatingRequest(method) &&
  !SILENT_URL_PATTERNS.some((pattern) => pattern.test(url ?? ""));

// Rejects with `error`, playing the action-fail sound first if the request
// that caused it was a create/update/delete call. Use this instead of a bare
// `Promise.reject(error)` for every *final* rejection below (i.e. not for
// requests just queued for retry, and not for the retried request itself —
// that retry gets its own success/error outcome through this same interceptor).
const rejectWithSound = (error: AxiosError, rejectValue: unknown = error) => {
  if (shouldPlaySound(error.config?.method, error.config?.url)) {
    playActionErrorSound();
  }
  return Promise.reject(rejectValue);
};

// Shape of a request that failed with 401 and is waiting in the queue
// while a token refresh is in progress.
type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
};

// URLs that should NEVER trigger the refresh-token flow,
// even if they return 401 (e.g. login/signup/refresh endpoints themselves).
const AUTH_SKIP_URLS = [
  "/auth/company/signup",
  "/auth/token/refresh",
  "/auth/company/signin",
];

// Global flag: true while a refresh request is in flight.
// Prevents multiple simultaneous refresh calls.
let isRefreshing = false;

// Queue of requests that failed with 401 while a refresh was already happening.
// They get retried once the new token is ready.
let failedRequestQueue: FailedRequest[] = [];

// Default timeout for normal (non-upload) requests.
const DEFAULT_TIMEOUT = 15000; // 15 seconds

// Extended timeout for requests that upload files (FormData),
// since file uploads generally take longer than normal JSON requests.
const UPLOAD_TIMEOUT = 60000; // 60 seconds

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Runs before every request is sent.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  // Attach the access token to every outgoing request, if we have one.
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Special handling for file/image uploads (FormData body).
  if (config.data instanceof FormData) {
    // IMPORTANT: do NOT manually set "Content-Type": "multipart/form-data".
    // The browser needs to generate the correct boundary string itself.
    // If we set it manually, the boundary will be missing and the backend
    // won't be able to parse the multipart body correctly.
    delete config.headers["Content-Type"];

    // Give uploads more time to complete than regular JSON requests.
    config.timeout = UPLOAD_TIMEOUT;
  }

  return config;
});

// ---------------------------------------------------------------------------
// Helper: resolves or rejects all requests waiting in the queue.
// Called after a token refresh attempt finishes (success or failure).
// ---------------------------------------------------------------------------
const processQueue = (error: unknown, token: string | null = null) => {
  failedRequestQueue.forEach((prom) => {
    if (error) {
      // Refresh failed -> reject every queued request with the same error.
      prom.reject(error);
    } else if (token) {
      // Refresh succeeded -> update the header with the new token
      // and retry the original request.
      if (prom.config.headers) {
        prom.config.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(api(prom.config));
    }
  });

  // Clear the queue once processed.
  failedRequestQueue = [];
};

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// Handles 401 errors by attempting a token refresh, then retrying.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    if (shouldPlaySound(response.config.method, response.config.url)) {
      playActionSuccessSound();
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If there's no config at all, we can't retry anything.
    if (!originalRequest) {
      return rejectWithSound(error);
    }

    // Don't attempt refresh logic on auth endpoints themselves
    // (login, signup, refresh) to avoid infinite loops.
    const isAuthUrl = AUTH_SKIP_URLS.some((u) =>
      originalRequest.url?.includes(u),
    );
    const is401 = error.response?.status === 401;

    if (is401 && !originalRequest._retry && !isAuthUrl) {
      // Mark this request so we don't try to refresh for it again.
      originalRequest._retry = true;

      if (isRefreshing) {
        // A refresh is already happening — queue this request instead of
        // firing a second refresh call. It will be resolved/rejected
        // once the ongoing refresh finishes.
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.ok) {
          // Update the header of the request that triggered the refresh.
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          }

          // Retry all requests that piled up in the queue with the new token.
          processQueue(null, refreshResult.token);

          // Retry the original request that caused the 401.
          return api(originalRequest);
        } else {
          // Refresh endpoint responded, but refresh was not successful
          // (e.g. refresh token expired) — reject everything.
          processQueue(error);
          return rejectWithSound(error);
        }
      } catch (refreshError) {
        // Refresh call itself threw (network error, etc.) — reject everything.
        processQueue(refreshError);
        return rejectWithSound(error, refreshError);
      } finally {
        // Always release the lock so future 401s can trigger a new refresh.
        isRefreshing = false;
      }
    }

    // Any other error (not 401, already retried, or an auth URL) — just reject.
    return rejectWithSound(error);
  },
);

export default api;
