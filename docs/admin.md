# Panel Administrativo — INFI TV (FASE 7)

Panel web para administrar la plataforma. Next.js App Router + TypeScript
strict + Tailwind CSS + TanStack Query. Habla **solo HTTPS/REST** contra el
backend NestJS (`/api/v1`); nunca toca la base de datos directamente.

## Stack

- **Next.js 14** (App Router), **React 18**, **TypeScript strict**.
- **Tailwind CSS 3** con design system propio (dark, acento violeta).
- **TanStack Query 5** para data fetching y caché.
- **Vitest** para tests unitarios de lógica crítica.

## Cómo se autentica

El panel usa **refresh token en cookie httpOnly** (nunca toca JS) y
**access token en memoria + sessionStorage**:

```text
POST /api/auth/login   → llama al backend, setea cookie httpOnly `infitv_refresh`
POST /api/auth/refresh → rota el refresh token (lee la cookie server-side)
POST /api/auth/logout  → revoca y borra la cookie
```

- El `middleware.ts` redirige a `/login` si no hay cookie.
- El cliente (`lib/api.ts`) desenvuelve el envelope `{ success, data }` /
  `{ success: false, error }` y reintenta UNA vez con refresh ante un 401.
- La identidad del admin se cachea en `sessionStorage`; el layout del
  dashboard hace silent refresh al montar.

## Estructura

```text
apps/admin/
├── middleware.ts                 # gate de auth
├── app/
│   ├── layout.tsx                # root layout + Providers
│   ├── providers.tsx             # QueryClient + Toaster + manejo de 401 global
│   ├── login/page.tsx
│   ├── api/auth/{login,refresh,logout}/route.ts
│   └── (dashboard)/
│       ├── layout.tsx            # sidebar + topbar + useSession
│       ├── dashboard/page.tsx    # métricas (GET /admin/stats)
│       ├── clientes/page.tsx
│       ├── codigos/page.tsx
│       ├── planes/page.tsx
│       ├── dispositivos/page.tsx
│       ├── sesiones/page.tsx
│       ├── logs/page.tsx         # auditoría (SUPER_ADMIN)
│       └── usuarios/page.tsx     # admin-users (SUPER_ADMIN)
├── components/
│   ├── ui/                       # badge, modal, table, pagination, toast…
│   └── layout/                   # sidebar, topbar
├── hooks/                        # use-session, resources (TanStack Query)
└── lib/                          # api, auth-store, types, status, format, permissions
```

## Páginas

| Ruta | Permisos | Funciones |
|------|----------|-----------|
| `/login` | público | login email + password |
| `/dashboard` | cualquier admin | métricas agregadas (clientes, códigos, dispositivos, sesiones) |
| `/clientes` | lectura todos · escritura ADMIN+ · borrar SUPER_ADMIN | CRUD, suspender/reactivar, renovar, detalle con contadores |
| `/codigos` | escritura ADMIN+ | generar 1–500, suspender/reactivar, revocar, cambiar límite |
| `/planes` | escritura ADMIN+ | CRUD, precio interno (solo admin) |
| `/dispositivos` | escritura ADMIN+ | bloquear/desbloquear, revocar, desvincular |
| `/sesiones` | escritura ADMIN+ | listar, revocar |
| `/logs` | SUPER_ADMIN | auditoría |
| `/usuarios` | SUPER_ADMIN | CRUD administradores |

El RBAC de la UI es solo UX: la autoridad es el backend (JWT + RolesGuard).

## Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1   # origen del backend
```

Para desarrollo local (este repo) el backend puede correr en otro puerto
(p. ej. `:3002` si el `:3000` está ocupado); en ese caso se usa
`apps/admin/.env.local` (gitignored) con la URL correcta.

## Comandos

```powershell
npm run dev --workspace=infitv-admin        # next dev -p 3001
npm run build --workspace=infitv-admin      # build de producción
npm run lint --workspace=infitv-admin       # eslint
npm run test --workspace=infitv-admin       # vitest (12 tests)
npm run typecheck --workspace=infitv-admin  # tsc --noEmit
```

## Decisiones

- **Data fetching client-side** (TanStack Query) en vez de server components:
  el access token vive en el cliente, así que las páginas lo consumen vía
  `lib/api.ts` con refresh automático.
- **Endpoint `/admin/stats`** agregado al backend (módulo `stats`) para que
  el dashboard haga UNA sola llamada en vez de N.
- **Canales/Países/Categorías/EPG quedan FUERA** de esta fase: el backend
  aún no los expone (FASE 8/9). No se inventaron datos.
