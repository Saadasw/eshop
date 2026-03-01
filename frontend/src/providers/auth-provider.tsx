"use client";

/**
 * Auth context provider that manages user state and token lifecycle.
 *
 * On mount, checks localStorage for a refresh token, attempts to refresh,
 * and fetches the user profile. Exposes setAuth (for login/register)
 * and logout.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setAccessToken } from "@/lib/api/client";
import { getMe, logout as logoutApi, refreshTokens } from "@/lib/api/auth";
import { TOKEN_KEYS } from "@/lib/utils/constants";
import type { AuthResponse, UserRead } from "@/types/database";

interface AuthContextValue {
  user: UserRead | null;
  isLoading: boolean;
  setAuth: (response: AuthResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  /** Manages authenticated user state and token refresh on mount. */
  const [user, setUser] = useState<UserRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuth = useCallback((response: AuthResponse) => {
    /** Store tokens and set the authenticated user after login/register. */
    setAccessToken(response.tokens.access_token);
    localStorage.setItem(
      TOKEN_KEYS.REFRESH_TOKEN,
      response.tokens.refresh_token,
    );
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    /** Clear tokens, call logout API, and reset user state. */
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } finally {
      setAccessToken(null);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    /** On mount, attempt to restore the session from stored refresh token. */
    async function initAuth() {
      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await refreshTokens(refreshToken);
        setAccessToken(tokens.access_token);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refresh_token);

        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        // Token expired or invalid — clear and continue as guest
        setAccessToken(null);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access the auth context. Must be used within AuthProvider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
