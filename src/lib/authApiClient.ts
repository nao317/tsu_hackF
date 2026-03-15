"use client";

import { getMeAction, refreshTokenAction } from "@/actions/auth";
import type { AuthTokens } from "@/actions/types";
import {
  clearStoredAuth,
  getStoredAuthTokens,
  setStoredAuthTokens,
  setStoredAuthUser,
} from "@/lib/authStorage";

function isUnauthorizedError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return status === 401;
  }

  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();
    return (
      lowerMessage.includes("401") ||
      lowerMessage.includes("unauthorized") ||
      lowerMessage.includes("認証") ||
      lowerMessage.includes("token")
    );
  }

  return false;
}

async function refreshTokens(current: AuthTokens): Promise<AuthTokens> {
  const refreshed = await refreshTokenAction({
    refresh_token: current.refresh_token,
  });

  setStoredAuthTokens(refreshed);

  try {
    const me = await getMeAction(refreshed.access_token);
    setStoredAuthUser(me);
  } catch {
    // refresh 自体が成功していれば続行可能なため、/me の失敗はここでは握りつぶす。
  }

  return refreshed;
}

export function requireAuthTokens(): AuthTokens {
  const stored = getStoredAuthTokens();
  if (!stored) {
    throw new Error("ログインが必要です。再度ログインしてください。");
  }

  return stored;
}

export async function callWithAuthRetry<T>(
  handler: (accessToken: string) => Promise<T>,
): Promise<T> {
  const stored = requireAuthTokens();

  try {
    return await handler(stored.access_token);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    try {
      const refreshed = await refreshTokens(stored);
      return await handler(refreshed.access_token);
    } catch {
      clearStoredAuth();
      throw new Error(
        "セッションの有効期限が切れました。再度ログインしてください。",
      );
    }
  }
}
