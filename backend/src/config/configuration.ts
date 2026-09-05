/**
 * Configuración tipada del backend. Lee desde process.env
 * (inyectado por @nestjs/config). Sin secretos en código.
 */

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  throttleTtlMs: number;
  throttleLimit: number;
  abuseMaxFailures: number;
  abuseWindowMs: number;
  abuseBlockMs: number;
}

function parseOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return ["http://localhost:3001"];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function buildAppConfig(
  env: Record<string, string | undefined>,
): AppConfig {
  const portRaw = env["PORT"] ?? "3000";
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT inválido: "${portRaw}"`);
  }
  const ttlRaw = env["THROTTLE_TTL_MS"] ?? "60000";
  const ttl = Number.parseInt(ttlRaw, 10);
  if (!Number.isInteger(ttl) || ttl < 1000) {
    throw new Error(`THROTTLE_TTL_MS inválido: "${ttlRaw}"`);
  }
  const limitRaw = env["THROTTLE_LIMIT"] ?? "100";
  const limit = Number.parseInt(limitRaw, 10);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`THROTTLE_LIMIT inválido: "${limitRaw}"`);
  }
  const abuseMaxRaw = env["ABUSE_MAX_FAILURES"] ?? "10";
  const abuseMax = Number.parseInt(abuseMaxRaw, 10);
  if (!Number.isInteger(abuseMax) || abuseMax < 1) {
    throw new Error(`ABUSE_MAX_FAILURES inválido: "${abuseMaxRaw}"`);
  }
  const abuseWindowRaw = env["ABUSE_WINDOW_MS"] ?? "900000";
  const abuseWindow = Number.parseInt(abuseWindowRaw, 10);
  if (!Number.isInteger(abuseWindow) || abuseWindow < 1000) {
    throw new Error(`ABUSE_WINDOW_MS inválido: "${abuseWindowRaw}"`);
  }
  const abuseBlockRaw = env["ABUSE_BLOCK_MS"] ?? "1800000";
  const abuseBlock = Number.parseInt(abuseBlockRaw, 10);
  if (!Number.isInteger(abuseBlock) || abuseBlock < 1000) {
    throw new Error(`ABUSE_BLOCK_MS inválido: "${abuseBlockRaw}"`);
  }
  return {
    nodeEnv: env["NODE_ENV"] ?? "development",
    port,
    corsOrigins: parseOrigins(env["CORS_ORIGINS"]),
    throttleTtlMs: ttl,
    throttleLimit: limit,
    abuseMaxFailures: abuseMax,
    abuseWindowMs: abuseWindow,
    abuseBlockMs: abuseBlock,
  };
}

export default (): { app: AppConfig } => ({
  app: buildAppConfig(process.env),
});
