import type {
  ActivationCodeStatus,
  CustomerStatus,
  DeviceStatus,
  SessionStatus,
} from "@infitv/types";

/** Etiquetas en español para estados de dominio. */
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  SUSPENDED: "Suspendido",
};

export const CODE_STATUS_LABEL: Record<ActivationCodeStatus, string> = {
  PENDING: "Sin activar",
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  SUSPENDED: "Suspendido",
  REVOKED: "Revocado",
};

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  ACTIVE: "Activo",
  REVOKED: "Revocado",
  BLOCKED: "Bloqueado",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  ACTIVE: "Activa",
  EXPIRED: "Expirada",
  REVOKED: "Revocada",
};

/** Tono de color para badges. Mapea a clases Tailwind del design system. */
export type Tone = "green" | "amber" | "red" | "blue" | "slate" | "violet";

const TONE_CLASS: Record<Tone, string> = {
  green: "bg-ok/10 text-ok border-ok/30",
  amber: "bg-warn/10 text-warn border-warn/30",
  red: "bg-danger/10 text-danger border-danger/30",
  blue: "bg-info/10 text-info border-info/30",
  slate: "bg-ink-faint/10 text-ink-muted border-line",
  violet: "bg-brand/10 text-brand border-brand/30",
};

export function toneClass(tone: Tone): string {
  return TONE_CLASS[tone];
}

export const CUSTOMER_STATUS_TONE: Record<CustomerStatus, Tone> = {
  ACTIVE: "green",
  EXPIRED: "amber",
  SUSPENDED: "red",
};

export const CODE_STATUS_TONE: Record<ActivationCodeStatus, Tone> = {
  PENDING: "slate",
  ACTIVE: "green",
  EXPIRED: "amber",
  SUSPENDED: "red",
  REVOKED: "red",
};

export const DEVICE_STATUS_TONE: Record<DeviceStatus, Tone> = {
  ACTIVE: "green",
  REVOKED: "red",
  BLOCKED: "amber",
};

export const SESSION_STATUS_TONE: Record<SessionStatus, Tone> = {
  ACTIVE: "green",
  EXPIRED: "amber",
  REVOKED: "slate",
};
