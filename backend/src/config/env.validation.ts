import * as Joi from "joi";

/**
 * Validación estricta de variables de entorno.
 * Falla en el arranque si falta algo crítico (fail-fast),
 * pero DATABASE_URL permite placeholder en FASE 2 para que
 * el typecheck/build pasen sin DB real.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  ADMIN_JWT_SECRET: Joi.string().min(16).required(),
  CODE_PEPPER: Joi.string().min(16).required(),
  CORS_ORIGINS: Joi.string().default("http://localhost:3001"),
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
  ABUSE_MAX_FAILURES: Joi.number().integer().min(1).default(10),
  ABUSE_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  ABUSE_BLOCK_MS: Joi.number().integer().min(1000).default(1800000),
  IPTV_SOURCE_URL: Joi.string()
    .uri()
    .default("https://iptv-org.github.io/iptv/index.m3u"),
  EPG_SOURCE_URL: Joi.string().allow("").default(""),
  EPG_SYNC_CRON: Joi.string().default("0 */6 * * *"),
  EPG_SYNC_ENABLED: Joi.string().valid("true", "false").default("false"),
  IPTV_SYNC_CRON: Joi.string().default("0 */6 * * *"),
  IPTV_SYNC_ENABLED: Joi.string().valid("true", "false").default("false"),
  IPTV_EXTRA_SOURCES: Joi.string().allow("").default(""),
  XTREAM_BASE_URL: Joi.string().allow("").default(""),
  XTREAM_USERNAME: Joi.string().allow("").default(""),
  XTREAM_PASSWORD: Joi.string().allow("").default(""),
});
