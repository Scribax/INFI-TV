import type {
  ActivationCodeStatus,
  AdminRole,
  CustomerStatus,
  DeviceStatus,
  SessionStatus,
} from "@infitv/types";

/**
 * Tipos del panel admin. Reflejan EXACTAMENTE los shapes que devuelve el
 * backend NestJS (ver los services en backend/src y docs/api.md).
 * Los estados/enums se importan de @infitv/types para no duplicarlos.
 */

export interface AdminIdentity {
  id: string;
  email: string;
  role: AdminRole;
}

export interface LoginResult {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  admin: AdminIdentity;
}

export interface PlanSummary {
  id: string;
  name: string;
  durationDays: number;
  deviceLimit: number;
  isActive: boolean;
}

export interface AdminPlan {
  id: string;
  name: string;
  durationDays: number;
  priceInternalCents: number;
  deviceLimit: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItem {
  id: string;
  displayName: string;
  status: CustomerStatus;
  planId: string | null;
  expiresAt: string | null;
  lastSeenAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  plan: PlanSummary | null;
}

export interface CustomerDetail extends CustomerListItem {
  _count: {
    devices: number;
    sessions: number;
    favorites: number;
  };
}

export interface CodeListItem {
  id: string;
  prefix: string;
  status: ActivationCodeStatus;
  planId: string;
  customerId: string | null;
  deviceLimit: number;
  activatedAt: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  plan: { id: string; name: string };
  customer: { id: string; displayName: string } | null;
  devicesTotal: number;
}

export interface CodeCreatedItem {
  id: string;
  prefix: string;
  status: ActivationCodeStatus;
  planId: string;
  customerId: string | null;
  deviceLimit: number;
  activatedAt: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Texto plano del código. Solo aparece en la respuesta de creación. */
  code: string;
}

export interface CreateCodesResult {
  count: number;
  items: CodeCreatedItem[];
}

export interface CodeDetail
  extends Omit<CodeListItem, "plan" | "customer"> {
  plan: AdminPlan;
  customer: {
    id: string;
    displayName: string;
    status: CustomerStatus;
  } | null;
  devices: Array<{
    id: string;
    platform: string;
    appVersion: string;
    status: DeviceStatus;
    lastSeenAt: string | null;
  }>;
  devicesUsed: number;
}

export interface DeviceListItem {
  id: string;
  customerId: string;
  appInstanceId: string;
  platform: string;
  appVersion: string;
  model: string | null;
  osVersion: string | null;
  lastSeenAt: string | null;
  ipLast: string | null;
  status: DeviceStatus;
  activationCodeId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; displayName: string; status: CustomerStatus };
}

export interface SessionListItem {
  id: string;
  customerId: string;
  deviceId: string;
  status: SessionStatus;
  expiresAt: string;
  lastSeenAt: string | null;
  ipCreated: string | null;
  createdAt: string;
  customer: { id: string; displayName: string };
  device: { id: string; platform: string; appVersion: string };
}

export interface AuditLogEntry {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  customers: {
    total: number;
    active: number;
    expired: number;
    suspended: number;
  };
  codes: {
    total: number;
    pending: number;
    active: number;
    revoked: number;
  };
  devices: {
    total: number;
    active: number;
    blocked: number;
  };
  sessions: {
    active: number;
  };
  activations: {
    total: number;
  };
  playback: {
    plays: number;
    errors: number;
  };
  channels: {
    total: number;
    online: number;
    offline: number;
  };
  lastSeenAt: string | null;
}
