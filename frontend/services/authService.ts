/**
 * Auth API - register, login.
 * Components use hooks that call this; no direct API calls in UI.
 */

import { apiFetch } from "@/lib/api-client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName?: string;
}

export interface AuthResponse {
  token: string;
}

export async function login(creds: LoginCredentials): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(creds),
  });
}

export async function register(creds: RegisterCredentials): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(creds),
  });
}
