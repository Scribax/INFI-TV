# INFI TV — Arquitectura

## Diagrama general

```text
 PANEL ADMIN WEB ──HTTPS──▶ BACKEND API ──┬──▶ PostgreSQL
                                          └──▶ IPTV-org / fuentes
                                                    │
APK ANDROID (Expo) ──HTTPS──▶ BACKEND API ◀────────┘
```

- La APK **nunca** accede a PostgreSQL directamente. Solo HTTPS contra el backend.
- El backend es la autoridad para sesiones, vencimientos y límites de dispositivos.
- Versionado de API: `/api/v1/` (reservar `/api/v2/`).

## Monorepo (npm workspaces)

```text
backend      → NestJS + Prisma (FASE 2+)
apps/admin   → Next.js + Tailwind (FASE 7+)
apps/mobile  → Expo + React Native (FASE 10+)
packages/types  → interfaces compartidas (Channel, Customer, …)
packages/config → constantes compartidas (versión API, paginación, flags)
packages/utils  → utilidades puras (paginación, fechas, arrays)
```

Raíz:

- `package.json` — workspaces + scripts agregados (`typecheck`, `verify:phase1`).
- `tsconfig.base.json` — `strict: true`, `noUnusedLocals`, etc. Los packages la extienden.
- `.env.example` — todas las variables con valores de ejemplo. Nunca `.env` real.

## Decisiones FASE 1

1. **npm workspaces** (no pnpm/turborepo todavía) para minimizar fricción en Windows + Expo + NestJS. Se puede migrar a Turborepo en FASE 21 sin cambiar estructura.
2. **TypeScript strict** desde el día 1 en `tsconfig.base.json`.
3. **Contrato de respuestas API** fijado desde ahora (ver `packages/types`):
   - Éxito: `{ "success": true, "data": {} }`
   - Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
4. **Sin secretos en la APK** (principio de seguridad, FASE 18). Solo `EXPO_PUBLIC_API_URL`.
5. **Sync IPTV responsable** (FASE 8): parser → validador → normalizador → Postgres → API → APK, con job cada 6h y estrategia que nunca borra el catálogo por un fallo temporal.

## Flujo de activación (resumen, se implementa en FASE 5–6)

```text
APK → POST /api/v1/auth/activate { code, deviceInfo }
  → valida hash, estado, vencimiento, límite dispositivos
  → registra dispositivo + crea sesión
  → { success: true, token, expiresAt, customer }
APK guarda token en SecureStore (nunca AsyncStorage para secretos).
```

## Puertos y URLs (desarrollo)

- Backend: `http://localhost:3000` — `/api/v1/*`, `/docs` (Swagger, FASE 2+)
- Admin: `http://localhost:3001` (FASE 7+)
- Postgres: `localhost:5432` (FASE 2+)
- Redis: `localhost:6379` (opcional, FASE 19+)
