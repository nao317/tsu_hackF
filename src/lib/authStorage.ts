"use client";

import type { AuthTokens, User } from "@/actions/types";

export const AUTH_TOKENS_STORAGE_KEY = "auth_tokens";
export const AUTH_USER_STORAGE_KEY = "auth_user";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.access_token === "string" &&
    typeof value.refresh_token === "string" &&
    typeof value.token_type === "string" &&
    typeof value.expires_in === "number"
  );
}

function isUser(value: unknown): value is User {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.display_name === "string"
  );
}

export function getStoredAuthTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKENS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isAuthTokens(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export function getStoredAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: User): void {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}
