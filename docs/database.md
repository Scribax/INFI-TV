# Base de datos — INFI TV (FASE 2)

PostgreSQL + Prisma 6. Schema en `backend/prisma/schema.prisma`.
Migración inicial: `backend/prisma/migrations/0001_init/` (aplicada y verificada).

## PostgreSQL de desarrollo (Docker)

Contenedor `infitv-postgres-dev` (PostgreSQL 16, volumen `infitv-pgdata`).
Puerto **5433** en el host (el 5432 lo usa el servicio PostgreSQL de Windows).

```powershell
# Crear y arrancar (una sola vez; la DB infitv se crea sola):
docker run -d --name infitv-postgres-dev `
  -e POSTGRES_USER=infitv -e POSTGRES_PASSWORD=infitv -e POSTGRES_DB=infitv `
  -p 127.0.0.1:5433:5432 -v infitv-pgdata:/var/lib/postgresql/data `
  postgres:16-alpine

# Arrancar / detener en el día a día:
docker start infitv-postgres-dev
docker stop infitv-postgres-dev

# Aplicar migraciones:
$env:DATABASE_URL='postgresql://infitv:infitv@localhost:5433/infitv?schema=public'
npm run prisma:migrate:deploy --workspace=infitv-backend
```

`DATABASE_URL` de dev (también en `.env`, gitignoreado):

```env
DATABASE_URL=postgresql://infitv:infitv@localhost:5433/infitv?schema=public
```

> Alternativa sin Docker: cluster local con `initdb` en puerto 5434
> (ver historial del repo). El compose completo llega en FASE 19.

## Entidades (14)

- `AdminUser` (`admin_users`) — email único, passwordHash (argon2/bcrypt en FASE 3), rol, activo.
- `Customer` (`customers`) — displayName, status, plan, expiresAt, lastSeenAt.
- `ActivationCode` (`activation_codes`) — **codeHash único** (nunca texto plano), prefix visible, plan, cliente nullable, deviceLimit, activatedAt/expiresAt/lastUsedAt, metadata JSON, creado-por admin.
- `Device` (`devices`) — customer + appInstanceId **únicos juntos**, plataforma, versión app, último visto, IP mínima, estado. `ON DELETE CASCADE` desde customer.
- `Session` (`sessions`) — tokenHash único, device, customer, estado, expiración. Cascade.
- `Plan` (`plans`) — nombre único, duración días, precio interno centavos, deviceLimit, activo.
- `Channel` (`channels`) — externalId único (fuente), nombre, logo, streamUrl, país, categorías M2M, idioma, isActive/isHidden/isGlobalFavorite, streamStatus, checks (lastCheckedAt, lastSuccessfulAt, failureCount), epgChannelId.
- `Country` (`countries`, PK `code`), `Category` (`categories`, slug único).
- `Favorite` (`favorites`) — único (customer, channel), cascade ambos lados.
- `WatchHistory` (`watch_history`) — único (customer, channel) para upsert de últimos 20, índice (customer, watchedAt).
- `EPGProgram` (`epg_programs`) — channel, título, descripción, startsAt/endsAt, índice (channel, startsAt).
- `SystemSetting` (`system_settings`, PK `key`) — config remota (mantenimiento, versión mínima… en FASE 16+).
- `AuditLog` (`audit_logs`) — actorType/actorId, action, entity/entityId, metadata JSON, IP, índices en action/entity/createdAt.

## Índices y rendimiento

FKs, estados, expiraciones y búsquedas (`channels.name`, `activation_codes.status`, `sessions.expiresAt`…) indexados desde el día 1. Paginación obligatoria en APIs de catálogo (FASE 9).

## Migraciones

```powershell
npm run prisma:migrate:dev --workspace=infitv-backend -- --name init   # genera SQL en backend/prisma/migrations
npm run prisma:migrate:deploy --workspace=infitv-backend               # aplica en deploy
```

Nunca modificar producción manualmente. La migración inicial se genera en cuanto haya un Postgres disponible; el schema ya está validado con `prisma validate`.
