/**
 * Tipos compartidos INFI TV.
 * Usados por backend, admin y mobile para evitar duplicación.
 * Contrato de respuestas: { success: true, data } / { success: false, error }.
 */

export const API_VERSION = "v1" as const;

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorCode =
  | "INVALID_ACTIVATION_CODE"
  | "CODE_EXPIRED"
  | "CODE_SUSPENDED"
  | "DEVICE_LIMIT_REACHED"
  | "DEVICE_REVOKED"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "MAINTENANCE"
  | "INTERNAL_ERROR";

export type ApiFailure = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ActivationCodeStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED";

export type CustomerStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type DeviceStatus = "ACTIVE" | "REVOKED" | "BLOCKED";

export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type StreamStatus = "ONLINE" | "OFFLINE" | "TIMEOUT" | "UNKNOWN";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "OPERATOR";

export interface Plan {
  id: string;
  name: string;
  durationDays: number;
  deviceLimit: number;
  description: string | null;
  isActive: boolean;
}

export interface Customer {
  id: string;
  displayName: string;
  status: CustomerStatus;
  planId: string | null;
  expiresAt: string | null;
  lastSeenAt: string | null;
}

export interface ActivationCodePublic {
  id: string;
  prefix: string;
  status: ActivationCodeStatus;
  planId: string;
  deviceLimit: number;
  devicesUsed: number;
  expiresAt: string | null;
  activatedAt: string | null;
}

export interface Device {
  id: string;
  customerId: string;
  platform: string;
  appVersion: string;
  lastSeenAt: string | null;
  status: DeviceStatus;
}

export interface Session {
  id: string;
  customerId: string;
  deviceId: string;
  expiresAt: string;
  status: SessionStatus;
}

export interface Country {
  code: string;
  name: string;
  flag: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  logoUrl: string | null;
  streamUrl: string;
  countryCode: string | null;
  categoryIds: string[];
  language: string | null;
  isActive: boolean;
  streamStatus: StreamStatus;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AppRemoteConfig {
  minimumAppVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  announcement: string | null;
  catalogVersion: number;
  featureFlags: Record<string, boolean>;
}

export interface ActivationSuccessData {
  token: string;
  expiresAt: string;
  customer: {
    id: string;
    plan: string;
    expiresAt: string | null;
  };
}
