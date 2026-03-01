/**
 * Typed API wrappers for backend auth endpoints.
 */

import { api } from "./client";
import { API_ROUTES } from "@/lib/utils/constants";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPair,
  UserRead,
} from "@/types/database";

/** Register a new user with Supabase token and profile data. */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    API_ROUTES.AUTH.REGISTER,
    data,
  );
  return response.data;
}

/** Login with a Supabase access token. */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, data);
  return response.data;
}

/** Refresh the access/refresh token pair. */
export async function refreshTokens(
  refreshToken: string,
): Promise<TokenPair> {
  const response = await api.post<TokenPair>(API_ROUTES.AUTH.REFRESH, {
    refresh_token: refreshToken,
  });
  return response.data;
}

/** Logout and invalidate the current session. */
export async function logout(refreshToken: string): Promise<void> {
  await api.post(API_ROUTES.AUTH.LOGOUT, { refresh_token: refreshToken });
}

/** Fetch the current authenticated user's profile. */
export async function getMe(): Promise<UserRead> {
  const response = await api.get<UserRead>(API_ROUTES.AUTH.ME);
  return response.data;
}
