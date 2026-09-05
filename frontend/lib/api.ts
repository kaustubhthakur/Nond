import {
  ApiError,
  ApiErrorBody,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  SendOtpPayload,
  User,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

const AUTH_API_URL = `${API_BASE_URL}/auth`;

async function request<T>(path: string, body: unknown): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${AUTH_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {

  }

  if (!res.ok) {
    const errBody = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      errBody.error ?? `Request failed (${res.status})`,
      res.status,
      errBody.retryAfter
    );
  }

  return data as T;
}

export interface ApiFetchOptions extends RequestInit {}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {

  }

  if (!res.ok) {
    const errBody = (data ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      errBody.error ?? `Request failed (${res.status})`,
      res.status,
      errBody.retryAfter
    );
  }

  return data as T;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ success: true; message: string; user: User }>(
      "/register",
      payload
    ),

  login: (payload: LoginPayload) =>
    request<LoginResponse>("/login", payload),

  sendOtp: (payload: SendOtpPayload) =>
    request<{ success: true; message: string; userId: string | number; method: string }>(
      "/sendOtp",
      payload
    ),

  verifyOtp: (payload: VerifyOtpPayload) =>
    request<VerifyOtpResponse>("/verifyOtp", payload),

  verifyEmail: (userId: string | number) =>
    request<{ success: true; message: string; user: User }>(
      "/verifyEmail",
      { userId }
    ),

  verifyPhone: (userId: string | number) =>
    request<{ success: true; message: string; user: User }>(
      "/verifyPhone",
      { userId }
    ),

  logout: () =>
    request<{ success: true; message: string }>("/logout", {}),
};