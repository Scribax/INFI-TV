# Backend — INFI TV (FASE 2)

## Stack

NestJS 11 + Express + TypeScript strict. Configuración con `@nestjs/config` + Joi (fail-fast).

## Estructura

```text
backend/src/
├── main.ts                  # helmet, CORS, /api + versionado, ValidationPipe, Swagger /docs
├── app.module.ts            # Config, Throttler global, Prisma global, Health
├── config/
│   ├── configuration.ts     # AppConfig tipada (puerto, CORS, throttle)
│   └── env.validation.ts    # schema Joi
├── common/
│   ├── prisma/              # PrismaService resiliente + PrismaModule global
│   ├── filters/             # HttpExceptionFilter → { success:false, error:{code,message} }
│   └── interceptors/        # ResponseInterceptor → { success:true, data }
└── health/                  # GET /api/v1/health (API + ping DB, nunca lanza)
```

## Contrato de respuestas

- Éxito: `{ "success": true, "data": {} }` (vía interceptor global).
- Error: `{ "success": false, "error": { "code", "message" } }` (vía filtro global).
- Sin stack traces ni secretos al cliente. Detalle solo en logs del servidor.

## Seguridad base (se endurece en FASE 18)

- `helmet()` + CORS con orígenes explícitos (`CORS_ORIGINS`).
- `ValidationPipe` con `whitelist + forbidNonWhitelisted + transform`.
- `ThrottlerGuard` global (100 req/min por defecto, configurable).
- Sin secretos en código ni logs (ver `main.ts` y filtro).

## Swagger

`GET /docs` (solo desarrollo; en producción se restringe en FASE 18/19).

## Autenticación administrativa (FASE 3)

- Hash **argon2id** centralizado en `PasswordService` (rotar algoritmo = un archivo).
- Login `POST /api/v1/admin/auth/login` limitado a 20 req/min por IP; mensaje
  genérico `Credenciales inválidas.` exista o no el email (sin enumeración);
  verificación dummy ante email inexistente para igualar tiempos.
- Access **JWT** corto (15m, `ADMIN_JWT_SECRET`) + refresh **opaco** (48 bytes,
  en DB solo SHA-256). Rotación con revocación del anterior; logout idempotente.
- Cambio de contraseña revoca todas las sesiones del admin.
- `JwtAuthGuard` revalida en DB en cada request (rol y `isActive`); si el rol
  del token difiere del de la DB, se rechaza.
- RBAC por jerarquía (`RolesGuard` + `@Roles`): `SUPER_ADMIN > ADMIN > OPERATOR`.
- `AdminUsersService`: email normalizado, nunca expone `passwordHash`,
  protección del último `SUPER_ADMIN` activo y anti-auto-degradación.
- `AuditService`: registra login/logout/refresh/gestión de admins. Nunca lanza.
- Seed dev: `npm run prisma:seed` crea el primer `SUPER_ADMIN` (se niega en prod).
- Tests: unitarios (31) + E2E contra `infitv_test` (`npm run test:e2e`).

## Planes y clientes (FASE 4)

- `PlansService`: nombre único, duración 1–1825 días, precio interno en centavos
  (solo API admin, jamás APK), `deviceLimit`, borrado solo sin uso (409 si hay
  referencias, por el `Restrict` de Prisma).
- `CustomersService`: alta con vencimiento calculado, edición, suspensión
  idempotente con motivo en auditoría, reactivación, renovación desde
  `max(ahora, vencimiento)` + duración del plan (propio o indicado),
  borrado en cascada solo SUPER_ADMIN.
- `isEffectivelyActive()`: predicado puro y testeado — el backend es la
  autoridad, la APK nunca decide el acceso (lo usará FASE 6).
- `CustomerExpirationService`: cron horario `ACTIVE → EXPIRED` con una sola
  fila de auditoría resumen del sistema.
- Escritura ADMIN+, borrado de clientes SUPER_ADMIN, lectura cualquier admin.

## Códigos de activación (FASE 5)

- `code-generator.ts`: formato `INFITV-XXXX-XXXX`, alfabeto de 31 símbolos sin
  ambigüedades, `crypto.randomInt` (jamás `Math.random`), normalización
  tolerante (minúsculas/espacios/guiones), HMAC-SHA256 con `CODE_PEPPER`,
  prefijo visible de 2 símbolos, `isCodeEffectivelyUsable()` testeado.
- `ActivationCodesService`: creación 1–500 con reintentos anti-colisión en
  transacción, listado con filtros (nunca hash ni plano), suspender/reactivar
  con restauración lógica, revocación terminal que suspende al cliente
  vinculado, `resolveForActivation()` con error siempre genérico.
- Sin endpoint DELETE: los códigos son trazabilidad, se revocan.
- El seed NO genera códigos demo (el plano no debe persistirse ni loguearse);
  en dev se crean vía `POST /admin/codes`.
- Migración 0003: `Device.activationCodeId` (qué código activó cada dispositivo).

## Dispositivos y sesiones (FASE 6)

- `POST /auth/activate` (30/min IP): resuelve el código (genérico si falla),
  crea o reutiliza cliente, upsert de dispositivo por
  `(customerId, appInstanceId)`, controla `deviceLimit` contando solo ACTIVE
  (403 con mensaje exacto de spec), primera activación inicia la suscripción.
  Transacción + `pg_advisory_xact_lock` por código (sin carreras de límite).
- Sesiones Bearer opacas de 256 bits (SHA-256 sin pepper: la entropía lo hace
  inviable offline; 30 días topadas al vencimiento del cliente).
- `SessionGuard` revalida en DB por request: cliente/estado/vencimiento,
  dispositivo y sesión. `GET /auth/session` con mensajes específicos
  (autenticado, sin riesgo de enumeración); `POST /auth/logout` idempotente.
- Admin: dispositivos (revocar/bloquear/desbloquear/desvincular) y sesiones
  (listar/revocar). `PATCH /admin/codes/:id` cambia `deviceLimit`.
- `apiError()` + filtro con passthrough de `{ code, message }` de dominio.
- E2E corre `--runInBand` (6 suites paralelas agotaban memoria con Prisma).
