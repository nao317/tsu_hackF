"use server";

import { apiRequest } from "./http";
import type {
  AuthTokens,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  SignupInput,
  User,
} from "./types";

export async function signupAction(input: SignupInput): Promise<User> {
  return apiRequest<User>("/auth/signup", {
    method: "POST",
    body: input,
  });
}

export async function loginAction(input: LoginInput): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function refreshTokenAction(
  input: RefreshTokenInput,
): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: input,
  });
}

export async function logoutAction(
  input: LogoutInput,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function getMeAction(accessToken: string): Promise<User> {
  return apiRequest<User>("/auth/me", {
    method: "GET",
    token: accessToken,
  });
}
