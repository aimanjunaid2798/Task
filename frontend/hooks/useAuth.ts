"use client";

import { useState, useCallback, useEffect } from "react";
import { setToken, clearToken, getToken } from "@/lib/auth";
import * as authService from "@/services/authService";

export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(!!getToken());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token } = await authService.login({ email, password });
      setToken(token);
      setAuthenticated(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setError(null);
    try {
      const { token } = await authService.register({ email, password, fullName });
      setToken(token);
      setAuthenticated(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setAuthenticated(false);
  }, []);

  return { login, register, logout, error, isAuthenticated: authenticated };
}
