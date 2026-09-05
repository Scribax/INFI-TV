# Troubleshooting (FASE 23)

## Puertos

| Servicio | Puerto | Nota |
| --- | --- | --- |
| Backend (dev) | `3002` | `:3000` lo ocupa `revender-gateway` (no tocar) |
| Admin (dev) | `3001` | Next.js |
| Postgres (Docker) | host `5433` → `5432` | `infitv-postgres-dev` |

## Build vs dev (Next.js)

`next build` mientras `next dev` corre corrompe `.next/` (comparten carpeta) →
el login se ve sin CSS y los assets dan 404.

Fix: matar el dev (por el PID real, no el wrapper npm), `rm -rf .next`,
relanzar. El `kill` del wrapper npm no mata el server Node → `EADDRINUSE`;
buscar el PID con `netstat -ano | grep ':3001'` y `Stop-Process -Force`.

## Backend zombie en :3002

`nest --watch` puede crashear (0xC0000142) dejando un server viejo en :3002
que sirve una versión sin los módulos nuevos → endpoints 404.

Fix: `netstat -ano | grep ':3002'` → `powershell Stop-Process -Id <pid> -Force`
→ relanzar. En Git Bash el `rm`/`kill` del wrapper no siempre libera el puerto.

## Expo

- `create-expo-app@latest` falla con npm 11 (bug `npm pack --dry-run`):
  usar `npm pack expo-template-default@latest` + `tar -xzf`.
- Lint Expo (react-hooks v6 + React Compiler) marca:
  - `set-state-in-effect` — el fetch-on-mount debe hacer setState solo tras el
    `await` (IIFE con flag `cancelled`), no llamar una función `load` que hace
    setState síncrono.
  - `purity` — no leer `Date.now()`/`Math.random()` en el render; calcularlo en
    el servidor (p. ej. `isLive` del EPG) o en un hook.

## Prisma

- El modelo `EPGProgram` genera el accessor `ePGProgram` (acrónimo) en el
  cliente: `prisma.ePGProgram`, no `prisma.epgProgram`.

## Tests

- `jest.resetAllMocks()` borra también `mockImplementation`; para conservar
  la implementación de un mock usar `jest.clearAllMocks()`.
- Los e2e (`backend/test/*.e2e-spec.ts`) requieren Postgres +
  `TEST_DATABASE_URL`; se corren con `npx jest --config test/jest-e2e.json`.

## Verificación de una fase

`npm run verify:phase<N>` (scripts `scripts/check-phase<N>.mjs`). No avanzar
de fase si la actual no está en PASS.
