# Backend — INFI TV (FASE 3)

NestJS 11 + Prisma 6 + PostgreSQL 16. API versionada `/api/v1`, Swagger en `/docs`.
Auth administrativa con argon2id + JWT + refresh opaco + RBAC + auditoría.

## Requisitos

- Node >= 20, npm >= 10
- PostgreSQL 16 (puede estar apagado en dev: la API arranca igual y `/health` reporta `database: down`)

## Variables de entorno

Se leen desde la raíz (`../.env`) o `backend/.env`. Ver `../.env.example`:

```env
DATABASE_URL=postgresql://infitv:infitv@localhost:5432/infitv?schema=public
JWT_SECRET=cambia-este-secreto
ADMIN_JWT_SECRET=cambia-este-secreto-admin
PORT=3000
CORS_ORIGINS=http://localhost:3001
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
```

## Comandos

```powershell
npm install                              # desde la raíz (workspaces)
npm run prisma:validate --workspace=infitv-backend
npm run prisma:generate --workspace=infitv-backend
npm run typecheck --workspace=infitv-backend
npm run lint --workspace=infitv-backend
npm run test --workspace=infitv-backend
npm run test:e2e --workspace=infitv-backend   # contra infitv_test (TEST_DATABASE_URL)
npm run build --workspace=infitv-backend
npm run start:dev --workspace=infitv-backend
```

## Seed dev (primer SUPER_ADMIN)

```powershell
$env:DATABASE_URL='postgresql://infitv:infitv@localhost:5433/infitv?schema=public'
$env:SEED_ADMIN_EMAIL='admin@infitv.local'
$env:SEED_ADMIN_PASSWORD='clave-dev-min-12-chars'
npm run prisma:seed --workspace=infitv-backend
```

Se niega a correr con `NODE_ENV=production`.

## Migraciones (nunca editar prod manualmente)

```powershell
# Con Postgres corriendo:
npm run prisma:migrate:dev --workspace=infitv-backend -- --name init
npm run prisma:migrate:deploy --workspace=infitv-backend
```

## Endpoints

- `GET /api/v1/health` → `{ success: true, data: { status, version, uptimeSec, database } }`
- `GET /docs` → Swagger
- Admin auth: `POST /api/v1/admin/auth/login|refresh|logout`, `GET /api/v1/admin/auth/me`
- Admin users: `POST|GET /api/v1/admin/users`, `GET|PATCH /api/v1/admin/users/:id`, `POST /api/v1/admin/users/:id/password`
- Auditoría: `GET /api/v1/admin/audit-logs` (SUPER_ADMIN)
- Planes: `POST|GET /api/v1/admin/plans`, `GET|PATCH|DELETE /api/v1/admin/plans/:id`
- Clientes: `POST|GET /api/v1/admin/customers`, `GET|PATCH|DELETE /api/v1/admin/customers/:id`, `POST .../suspend|reactivate|renew`
- Códigos: `POST|GET /api/v1/admin/codes`, `GET|PATCH /api/v1/admin/codes/:id`, `POST .../suspend|reactivate|revoke`
- Activación pública: `POST /api/v1/auth/activate`, `GET /api/v1/auth/session`, `POST /api/v1/auth/logout`
- Dispositivos: `GET /api/v1/admin/devices`, `GET|DELETE /api/v1/admin/devices/:id`, `POST .../revoke|block|unblock`
- Sesiones: `GET /api/v1/admin/sessions`, `POST /api/v1/admin/sessions/:id/revoke`

Ver `../docs/api.md`.
