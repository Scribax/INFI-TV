/**
 * Configuración compartida. Solo constantes públicas.
 * NUNCA poner secretos (JWT, DB, API keys) aquí — van en backend vía env.
 */

export const API_VERSION = "v1" as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const WATCH_HISTORY_MAX = 20;

/** Debounce de búsqueda en la app (ms), según especificación 250–400. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Intervalo de sync IPTV (horas). Job real en FASE 8. */
export const IPTV_SYNC_INTERVAL_HOURS = 6;

/** Prefijo visible de códigos de activación. */
export const ACTIVATION_CODE_PREFIX = "INFITV" as const;

export const APP_NAME = "INFI TV" as const;

export const FEATURE_FLAGS_DEFAULTS: Record<string, boolean> = {
  epgEnabled: false,
  streamHealthCheckEnabled: false,
};
