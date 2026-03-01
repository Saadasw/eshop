/**
 * Axios instance configured for our FastAPI backend with JWT auth.
 *
 * Access token is stored in a module-level variable (not localStorage)
 * for XSS protection. Refresh token is stored in localStorage since
 * it's only used to obtain new access tokens.
 *
 * Includes automatic token refresh on 401 responses with request queuing.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ROUTES, TOKEN_KEYS } from "@/lib/utils/constants";
import type { TokenPair } from "@/types/database";

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}[] = [];

/** Set the in-memory access token (called after login/register/refresh). */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Get the current in-memory access token. */
export function getAccessToken(): string | null {
  return accessToken;
}

function processQueue(error: unknown, token: string | null = null) {
  /** Resolve or reject all queued requests after token refresh. */
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  /** Attach JWT access token to every outgoing request. */
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    /** Handle 401 by refreshing the access token and retrying the request. */
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
        : null;

    if (!refreshToken) {
      isRefreshing = false;
      processQueue(error, null);
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<TokenPair>(
        `${process.env.NEXT_PUBLIC_API_URL}${API_ROUTES.AUTH.REFRESH}`,
        { refresh_token: refreshToken },
      );

      setAccessToken(data.access_token);
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, data.refresh_token);

      processQueue(null, data.access_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { api };
