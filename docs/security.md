# Seguridad y rate limiting (FASE 18)

## RBAC (§34)

Roles `SUPER_ADMIN` / `ADMIN` / `OPERATOR` con `RolesGuard`. Los endpoints de
admin exigen `JwtAuthGuard` + `RolesGuard`; la auditoría es solo SUPER_ADMIN.

## Rate limiting (§36)

`ThrottlerModule` global (`APP_GUARD ThrottlerGuard`, default 100 req/60 s) +
límites específicos:

- `POST /auth/activate` — 30/min.
- `POST /auth/login` y `POST /auth/refresh` — 20/min.
- `POST /admin/codes` — 30/min.

Configurables con `THROTTLE_TTL_MS` / `THROTTLE_LIMIT`.

## Protección de códigos (§37)

- **Anti-enumeración**: errores genéricos (`INVALID_ACTIVATION_CODE`) salvo
  `DEVICE_LIMIT_REACHED`, que exige conocer un código válido. Nunca se revela
  si un código existe.
- **Detección de abuso**: `ActivationAbuseService` cuenta intentos fallidos de
  activación por IP y por `appInstanceId`.
- **Bloqueo temporal**: tras `ABUSE_MAX_FAILURES` fallos en `ABUSE_WINDOW_MS`,
  la IP/dispositivo queda bloqueado `ABUSE_BLOCK_MS` → `429 RATE_LIMITED`.
- **Logging**: los fallos y bloqueos quedan en logs/auditoría.

El store es en memoria (una instancia); en deployment multi-instancia se
reemplaza por Redis (`REDIS_URL` ya previsto en el schema de env).
