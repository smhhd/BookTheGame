import type { ApiEnvelope, ApiErrorEnvelope } from "../types/api";

export const TOKEN_KEY = "book-the-game-token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10_000);

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details: unknown[] = []) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  if (options.body) headers.set("content-type", "application/json");
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set("authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
  } catch (error) {
    throw new ApiError(0, "NETWORK_ERROR", error instanceof Error ? error.message : "ارتباط با سرور برقرار نشد");
  }
  let payload: ApiEnvelope<T> | ApiErrorEnvelope;
  try {
    payload = await response.json() as ApiEnvelope<T> | ApiErrorEnvelope;
  } catch {
    throw new ApiError(response.status, "INVALID_RESPONSE", "پاسخ نامعتبر از سرور دریافت شد");
  }
  if (!response.ok || !payload.success) {
    const failed = payload as ApiErrorEnvelope;
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(response.status, failed.error?.code ?? "REQUEST_FAILED", payload.message, failed.error?.details ?? []);
  }
  return payload.data;
}

export const toQuery = (values: Record<string, string | number | boolean | undefined | null>) => {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};
