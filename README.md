# INFI TV — Plataforma IPTV completa (monorepo)

Plataforma IPTV con backend propio, panel administrativo y app Android.
El cliente final entra **solo con un código de activación** (sin usuario,
sin contraseña, sin registro). El backend es la autoridad para sesiones,
vencimientos y límites de dispositivos.

> **Estado: COMPLETADO — las 23 fases en PASS.**
> Ver [Desarrollo por fases](#desarrollo-por-fases). Regla vigente: no se
> avanza de fase si la actual no está en `PASS`.

## Cómo se usa el producto

```text
CLIENTE                          ADMINISTRADOR
Instala APK                      Login en panel (email + password)
   ↓                                ↓
Introduce INFITV-XXXX-XXXX       Genera códigos (1–500)
   ↓                                ↓
ACTIVAR → HOME                   Entrega el código al cliente
   ↓                                ↓
Elige canal → ▶ reproduce       Ve estado, dispositivos y vencimientos
```

## Arquitectura

```text
PANEL ADMIN (F7+) ──HTTPS──▶ BACKEND API (NestJS) ──┬──▶ PostgreSQL 16
                                                    └──▶ IPTV-org (F8+)
APK ANDROID (F10+) ──HTTPS──▶ BACKEND API ◀─────────┘
```

Principios no negociables:

- La APK **nunca** accede a la DB; solo HTTPS contra `/api/v1`.
- El backend decide el acceso (`isEffectivelyActive`, sesiones, límites).
- Los secretos viven en el backend (JWT, pepper, DB). Nada en la APK.
- Respuestas con envelope: `{ success: true, data }` /
  `{ success: false, error: { code, message } }`.
- Sin `any`, sin `eslint-disable`, TypeScript `strict`, todo verificado
  con typecheck + lint + tests + E2E antes de cerrar cada fase.

## Desarrollo por fases

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Monorepo, workspaces, tipos/utils/config compartidos | ✅ PASS |
| 2 | Backend NestJS + PostgreSQL + Prisma (14 entidades, health, Swagger) | ✅ PASS |
| 3 | Admin auth (argon2id, JWT + refresh, RBAC, auditoría, seed) | ✅ PASS |
| 4 | Planes + clientes (ciclo de vida, renovación, expiración horaria) | ✅ PASS |
| 5 | Códigos de activación (HMAC + pepper, bulk 1–500, estados, revocación) | ✅ PASS |
| 6 | Activación (`POST /auth/activate`), sesiones, dispositivos | ✅ PASS |
| 7 | Panel administrativo (Next.js) | ✅ PASS |
| 8 | Integración IPTV-org (parser + sync + job) | ✅ PASS |
| 9 | API de canales (endpoints con sesión de cliente) | ✅ PASS |
| 10 | Proyecto React Native + Expo (scaffold + workspaces) | ✅ PASS |
| 11 | App móvil: activación por código (pantalla + sesión SecureStore) | ✅ PASS |
| 12 | App móvil: home + catálogo (tabs, grilla, filtros, búsqueda) | ✅ PASS |
| 13 | App móvil: favoritos + historial (endpoints /me + UI) | ✅ PASS |
| 14 | App móvil: reproductor HLS (expo-video, controles nativos) | ✅ PASS |
| 15 | EPG: guía XMLTV (sync + endpoint + UI en el canal) | ✅ PASS |
| 16 | App móvil: caché + offline (AsyncStorage, catálogo cacheado) | ✅ PASS |
| 17 | Estadísticas + logs (telemetría dashboard, auditoría) | ✅ PASS |
| 18 | Seguridad y rate limiting (throttle + anti-abuso) | ✅ PASS |
| 19 | Docker + Nginx (compose + Dockerfiles + reverse proxy) | ✅ PASS |
| 20 | Tests (unit backend/admin/mobile + e2e backend) | ✅ PASS |
| 21 | CI/CD (GitHub Actions: lint + typecheck + tests + build) | ✅ PASS |
| 22 | EAS Build (eas.json development/preview/production) | ✅ PASS |
| 23 | Deployment (stack completo listo para VPS) | ✅ PASS |

## Estructura

```text
infitv/
├── apps/
│   ├── mobile/                 # Expo + React Native + Expo Router (app Android)
│   └── admin/                  # Next.js + Tailwind + TanStack Query (panel, FASE 7)
├── packages/
│   ├── types/                  # ApiResponse, Channel, Customer, Plan, ...
│   ├── config/                 # API_PREFIX, paginación, debounce, flags
│   └── utils/                  # chunkArray, buildPagination, versiones, ...
├── backend/                    # NestJS 11 + Prisma 6
│   ├── prisma/
│   │   ├── schema.prisma       # 16 modelos (14 + AdminSession + M2M)
│   │   ├── migrations/         # 0001_init, 0002 admin-sessions, 0003 device-code
│   │   └── seed.ts             # SUPER_ADMIN + 6 planes (dev, idempotente)
│   └── src/
│       ├── main.ts             # helmet, CORS, /api + versionado, Swagger /docs
│       ├── app.module.ts
│       ├── config/             # AppConfig tipada + validación Joi (fail-fast)
│       ├── common/             # Prisma resiliente, filtro/envelope, apiError()
│       ├── health/             # GET /health (API + ping DB, nunca lanza)
│       ├── auth/               # login/refresh/logout/me (throttle + RBAC base)
│       ├── admin-users/        # CRUD admins, último-SUPER_ADMIN protegido
│       ├── audit/              # log + GET /admin/audit-logs
│       ├── plans/              # CRUD planes (precio interno solo admin)
│       ├── customers/          # CRUD + suspender/reactivar/renovar/borrar + cron
│       ├── codes/              # generar 1–500, suspender/reactivar/revocar/límite
│       ├── activation/         # POST /auth/activate, SessionGuard, sesiones
│       ├── devices/            # revocar/bloquear/desbloquear/desvincular
│       └── sessions/           # listar/revocar sesiones (sin tokens)
├── docker/                     # FASE 19 — Dockerfiles + Nginx
├── docs/                       # architecture, backend, database, api (+ resto en su fase)
├── scripts/                    # check-phaseN.mjs (verificación por fase)
├── docker-compose.yml          # placeholder hasta FASE 19
├── .env.example
├── package.json                # workspaces + scripts agregados
└── README.md
```

## Requisitos

- Node.js >= 20 < 25 · npm >= 10 · Git
- Docker Desktop (PostgreSQL 16 de desarrollo; el compose completo es FASE 19)
- Puertos libres: **3000** (API), **5433** (Postgres dev)

## Puesta en marcha (desarrollo)

```powershell
# 1. PostgreSQL dev (una vez; volumen infitv-pgdata persiste los datos)
docker run -d --name infitv-postgres-dev `
  -e POSTGRES_USER=infitv -e POSTGRES_PASSWORD=infitv -e POSTGRES_DB=infitv `
  -p 127.0.0.1:5433:5432 -v infitv-pgdata:/var/lib/postgresql/data `
  postgres:16-alpine
# Día a día: docker start|stop infitv-postgres-dev

# 2. Dependencias + entorno
npm install
Copy-Item .env.example .env   # ya apunta al Postgres de arriba

# 3. Migraciones + seed (SUPER_ADMIN + planes base)
npm run prisma:migrate:deploy --workspace=infitv-backend
npm run prisma:seed --workspace=infitv-backend

# 4. API en desarrollo
npm run start:dev --workspace=infitv-backend
# API → http://localhost:3000/api/v1 · Swagger → http://localhost:3000/docs
# Salud → http://localhost:3000/api/v1/health
```

## Comandos

```powershell
npm run typecheck              # todos los workspaces (backend compila antes @infitv/*)
npm run lint                   # backend: eslint strict + tests + seed
npm run test                   # backend: unitarios (solo raíz los agrega)

npm run test --workspace=infitv-backend      # unitarios (72)
npm run test:e2e --workspace=infitv-backend  # E2E vs infitv_test, secuencial (36)
npm run build --workspace=infitv-backend     # prebuild de packages + nest build

npm run verify:phase1 # ... hasta verify:phase7 (chequeos estructurales por fase)
```

Los E2E usan la DB `infitv_test` (la crea el harness) y nunca tocan desarrollo.

## Variables de entorno

Ver `.env.example`. Nunca commitear `.env`.

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` / `TEST_DATABASE_URL` | Postgres dev / test |
| `JWT_SECRET` / `ADMIN_JWT_SECRET` | Sesiones cliente (F6: opacas) / JWT admin (15m) |
| `CODE_PEPPER` | HMAC de códigos (sin él la DB no sirve para brute force) |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | `15m` / `7d` (admin) |
| `CORS_ORIGINS` | Orígenes permitidos |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | 60s / 100 global (login 20, activate 30, crear códigos 30) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seed dev (mín. 12, se niega en prod) |
| `IPTV_SOURCE_URL` / `EPG_SOURCE_URL` | Fuentes públicas (F8 / F15) |
| `API_URL`, `NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL` | URLs por app (F7 / F10) |

## API (resumen)

Contrato en `docs/api.md`. Endpoints actuales:

```text
Público cliente
POST /api/v1/auth/activate          {code, appInstanceId, platform, appVersion}
GET  /api/v1/auth/session           Bearer sesión → identidad validada
POST /api/v1/auth/logout            {token} (idempotente)

Admin (Bearer JWT + RBAC)
POST /api/v1/admin/auth/login|refresh|logout   GET /api/v1/admin/auth/me
POST|GET /api/v1/admin/users ...               GET /api/v1/admin/audit-logs
POST|GET /api/v1/admin/plans ...               CRUD clientes + suspender/reactivar/renovar
POST|GET /api/v1/admin/codes ...               suspender/reactivar/revocar/límite
GET  /api/v1/admin/devices ...                 revocar/bloquear/desbloquear/desvincular
GET  /api/v1/admin/sessions ...                revocar
GET  /api/v1/health  ·  GET /docs (Swagger)
```

Errores de dominio: `INVALID_ACTIVATION_CODE` (genérico, anti-enumeración),
`DEVICE_LIMIT_REACHED`, `SESSION_EXPIRED`, `CODE_EXPIRED`, `CODE_SUSPENDED`,
`DEVICE_REVOKED`, más los HTTP estándar.

## Seguridad (implementado hasta F6)

- Passwords admin con **argon2id**; códigos como **HMAC-SHA256 + pepper**
  (plano solo en la respuesta de creación); sesiones de 256 bits.
- Activación genérica ante código malo/revocado/vencido/suspendido
  (respuestas idénticas); límite de dispositivos con mensaje exacto de spec.
- `SessionGuard` revalida en DB por request (efecto inmediato de
  vencimiento/revocación/bloqueo). Cambio de clave revoca sesiones.
- Login admin 20/min, activación 30/min, creación de códigos 30/min + global.
- Auditoría de acciones sensibles; el servicio de auditoría nunca rompe el flujo.
- Pendiente (fases 17–19): endurecimiento 2FA/lockout, Redis, Nginx, producción.

## Tests

- **Unitarios (72):** hashing, tokens, RBAC, servicios con mocks, filtros,
  expiración, generador de códigos (formato, unicidad x1000, matriz de estados).
- **E2E (36, DB real):** auth admin + throttle, planes/clientes, códigos,
  activación matriz completa (Casos 1–5), throttle de activación.
- Regla: fase sin `PASS` en instalación + typecheck + lint + tests + build
  no se considera terminada.

## Documentación

- `docs/architecture.md` — diagrama, monorepo, decisiones
- `docs/backend.md` — módulos por fase, contrato de respuestas, seguridad base
- `docs/database.md` — 16 modelos, índices, migraciones, Postgres dev
- `docs/api.md` — referencia de endpoints y errores
- `admin.md` — panel administrativo (FASE 7).
- `iptv-sync.md` — integración IPTV-org (FASE 8).
- `mobile.md` — app móvil (FASE 10–12).
- `telemetry.md` — telemetría, auditoría y logging (FASE 17).
- `security.md` — seguridad y rate limiting (FASE 18).
- `deployment.md` — Docker + Nginx (FASE 19).
- `troubleshooting.md` — pitfalls y fixes (FASE 23).

## Licencias y derechos

El software de la plataforma es propio. Los streams de terceros (p. ej. listas
públicas de IPTV-org desde FASE 8) pertenecen a sus titulares y se consumen
respetando sus condiciones. La plataforma no implementa evasión de DRM,
paywalls, autenticaciones ni restricciones de acceso.
