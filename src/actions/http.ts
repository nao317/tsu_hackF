import "server-only";

import type { ApiErrorResponse } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  query?: Record<string, QueryValue>;
  body?:
    | FormData
    | URLSearchParams
    | string
    | Blob
    | ArrayBuffer
    | Record<string, unknown>;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, `${getApiBaseUrl()}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseApiError(
  response: Response,
): Promise<ApiErrorResponse | undefined> {
  try {
    const json = (await response.json()) as unknown;
    if (isRecord(json) && typeof json.error === "string") {
      const code = typeof json.code === "string" ? json.code : undefined;
      return {
        error: json.error,
        code,
      };
    }
  } catch {
    // Ignore parse error and fallback to status text.
  }

  return undefined;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  let body: BodyInit | undefined;

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (
    options.body instanceof FormData ||
    options.body instanceof URLSearchParams
  ) {
    body = options.body;
  } else if (
    typeof options.body === "string" ||
    options.body instanceof Blob ||
    options.body instanceof ArrayBuffer
  ) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    const apiError = await parseApiError(response);
    throw new ApiRequestError(
      apiError?.error ?? response.statusText,
      response.status,
      apiError?.code,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as TResponse;
}
