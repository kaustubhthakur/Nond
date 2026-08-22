export type OtpMethod = "email" | "phone";

export interface User {
  id: string | number;
  username: string;
  email: string;
  phone?: string;
  isadmin?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  [key: string]: unknown;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  message: string;
  userId: string | number;
  method: OtpMethod;
}

export interface VerifyOtpPayload {
  userId: string | number;
  otp: string;
  method: OtpMethod;
}

export interface VerifyOtpResponse {
  success: true;
  message: string;
  token: string;
  user: User;
}

export interface SendOtpPayload {
  userId: string | number;
  method?: OtpMethod;
}

export interface ApiErrorBody {
  error: string;
  retryAfter?: number;
}

export class ApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}