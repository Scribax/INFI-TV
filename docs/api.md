# API — INFI TV

Base: `/api/v1`. Envelope éxito `{ success: true, data }`,
error `{ success: false, error: { code, message } }`.

## Auth administrativa (`/admin/auth`)

| Método | Ruta | Auth | Límite | Descripción |
|--------|------|------|--------|-------------|
| POST | `/admin/auth/login` | no | 20/min IP | `{email, password}` → `{accessToken, accessExpiresAt, refreshToken, refreshExpiresAt, admin}` |
| POST | `/admin/auth/refresh` | no | 20/min IP | `{refreshToken}` → par nuevo, revoca el anterior |
| POST | `/admin/auth/logout` | no | global | `{refreshToken}` → `{revoked: true}` (idempotente) |
| GET | `/admin/auth/me` | Bearer | global | perfil `{id, email, role}` |

Errores típicos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401,
`Credenciales inválidas.` / `Sesión inválida o expirada.` / `No autenticado.`),
`RATE_LIMITED` (429).

## Administradores (`/admin/users`, Bearer)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/admin/users` | SUPER_ADMIN | `{email, password≥12, role}` |
| GET | `/admin/users?page=&pageSize=` | ADMIN | paginado `{items, page, pageSize, total, totalPages}` |
| GET | `/admin/users/:id` | ADMIN | detalle (sin hash) |
| PATCH | `/admin/users/:id` | SUPER_ADMIN | `{role?, isActive?}`; protege último SUPER_ADMIN y auto-cambios |
| POST | `/admin/users/:id/password` | propio o SUPER_ADMIN | `{newPassword, currentPassword?}`; revoca sesiones |

## Auditoría (`/admin/audit-logs`, Bearer, SUPER_ADMIN)

`GET /admin/audit-logs?page=&pageSize=&action=` → paginado descendente por fecha.

## Planes (`/admin/plans`, Bearer)

Escritura: ADMIN+. Lectura: cualquier admin. Sin endpoint público
(el precio interno nunca llega a la APK).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/admin/plans` | `{name, durationDays 1–1825, priceInternalCents?, deviceLimit 1–10?, description?, isActive?}` |
| GET | `/admin/plans?search=&isActive=&page=&pageSize=` | paginado |
| GET | `/admin/plans/:id` | detalle |
| PATCH | `/admin/plans/:id` | parcial |
| DELETE | `/admin/plans/:id` | solo sin uso (409 si lo usa un cliente/código); preferir desactivar |

## Clientes (`/admin/customers`, Bearer)

Lectura: cualquier admin. Mutaciones: ADMIN+. Borrado: SUPER_ADMIN.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/admin/customers` | `{displayName, planId?, notes?}`; con plan calcula `expiresAt = ahora + duración` |
| GET | `/admin/customers?search=&status=&planId=&page=&pageSize=` | paginado con plan |
| GET | `/admin/customers/:id` | detalle + contadores (dispositivos, sesiones, favoritos) |
| PATCH | `/admin/customers/:id` | `{displayName?, notes?, planId?}`; cambiar plan no toca vencimiento |
| POST | `/admin/customers/:id/suspend` | `{reason?}` → SUSPENDED (idempotente) |
| POST | `/admin/customers/:id/reactivate` | → ACTIVE (no extiende vencimiento) |
| POST | `/admin/customers/:id/renew` | `{planId?}` → `max(ahora, vencimiento) + duración`, reactiva |
| DELETE | `/admin/customers/:id` | cascada (dispositivos, sesiones, favoritos) |

Regla de acceso efectivo (autoridad: backend): `status ACTIVE` y
(`expiresAt` nulo o futuro). El job horario materializa `ACTIVE → EXPIRED`.

## Códigos (`/admin/codes`, Bearer)

Escritura: ADMIN+. Lectura: cualquier admin. Sin borrado (revocar en su lugar).

Seguridad: se guarda HMAC-SHA256 con `CODE_PEPPER` (nunca texto plano);
el plano sale SOLO en la respuesta de creación; el hash jamás se expone;
el prefijo visible filtra 2 de 8 símbolos.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/admin/codes` | `{planId, quantity 1–500?, deviceLimit?, customerId?, expiresAt?, metadata?}` → `{count, items: [{id, code, prefix, ...}]}` (30/min) |
| GET | `/admin/codes?search=&status=&planId=&customerId=&page=&pageSize=` | paginado con plan, cliente y conteo de dispositivos |
| GET | `/admin/codes/:id` | detalle + `devicesUsed` (ACTIVE) + dispositivos |
| POST | `/admin/codes/:id/suspend` | `{reason?}` PENDING/ACTIVE → SUSPENDED |
| POST | `/admin/codes/:id/reactivate` | SUSPENDED → PENDING (sin activar) o ACTIVE/EXPIRED |
| POST | `/admin/codes/:id/revoke` | terminal; suspende al cliente vinculado |

El endpoint público `POST /auth/activate` llega en FASE 6.

## Activación y sesiones públicas (`/auth`, sin prefijo admin)

| Método | Ruta | Auth | Límite | Descripción |
|--------|------|------|--------|-------------|
| POST | `/auth/activate` | no | 30/min IP | `{code, appInstanceId(uuid), platform, appVersion, model?, osVersion?}` → `{token, expiresAt, customer: {id, plan, expiresAt}}` |
| GET | `/auth/session` | Bearer sesión | global | identidad validada (autoridad del backend) |
| POST | `/auth/logout` | no | global | `{token}` → `{revoked: true}` (idempotente) |

Errores: activación fallida siempre `401 INVALID_ACTIVATION_CODE`
(`Código inválido o no disponible.`), salvo límite:
`403 DEVICE_LIMIT_REACHED` (`Este código ya alcanzó el límite de dispositivos.`).
Sesión: `401 SESSION_EXPIRED`, `401 CODE_EXPIRED`
(`Tu acceso ha vencido...`), `403 CODE_SUSPENDED`, `403 DEVICE_REVOKED`.

## Dispositivos (`/admin/devices`, Bearer)

Lectura: cualquier admin. Mutaciones: ADMIN+.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/devices?customerId=&status=&search=&page=&pageSize=` | paginado con cliente |
| GET | `/admin/devices/:id` | detalle + sesiones recientes |
| POST | `/admin/devices/:id/revoke` | revoca (ocupa slot; reactivar denegado) |
| POST | `/admin/devices/:id/block` | bloquea por abuso |
| POST | `/admin/devices/:id/unblock` | BLOCKED → ACTIVE |
| DELETE | `/admin/devices/:id` | desvincula y libera el slot (Caso 5) |

## Sesiones (`/admin/sessions`, Bearer, sin tokens en respuestas)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/sessions?customerId=&deviceId=&status=&page=&pageSize=` | paginado |
| POST | `/admin/sessions/:id/revoke` | ADMIN+ |

## Catálogo (canales, países, categorías)

Sesión de cliente (Bearer de activación). Solo expone canales `isActive` y no
ocultos. Sin token válido → `401 UNAUTHORIZED`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/channels?page=&pageSize=&country=&category=&search=` | paginado |
| GET | `/channels/:id` | detalle |
| GET | `/countries` | `[{code, name, flag}]` |
| GET | `/categories` | `[{id, slug, name}]` |
| GET | `/search?q=` | búsqueda por nombre (paginada) |

Item de canal: `{ id, name, logoUrl, streamUrl, countryCode,
categories: [{ slug, name }], language, isActive, streamStatus }`.

## Salud

`GET /health` → `{status, version, uptimeSec, database: up|down}`.
