# App móvil — INFI TV (FASE 10–12)

App Android (Expo + React Native + Expo Router). El cliente entra **solo con
un código de activación**; el backend es la autoridad (sesiones, vencimiento,
límite de dispositivos). La app nunca toca la DB: todo por HTTPS a `/api/v1`.

## Stack

- **Expo SDK 57** · React Native 0.86 · React 19 · TypeScript strict.
- **Expo Router** (file-based routing) con typed routes.
- **expo-secure-store** (token de sesión cifrado) · **expo-crypto** (UUID de
  instalación). Dark mode como diseño principal.

## Flujo

```text
ABRE INFI TV
   ↓
¿sesión válida? ── sí ──▶ Tabs (Inicio / Canales / Favoritos / Buscar / Más)
   │ no
   ▼
Ingresá tu código (INFITV-XXXX-XXXX)
   ↓ POST /auth/activate { code, appInstanceId, platform, appVersion }
   ↓ token → SecureStore
   ▼
Tabs
```

- `appInstanceId` es un UUID persistido (crypto seguro), no el único factor
  de seguridad.
- En cada arranque valida con `GET /auth/session`; si expiró, vuelve a activar.

## Estructura

```text
src/
├── app/
│   ├── _layout.tsx          # Stack root
│   ├── index.tsx            # pantalla de activación
│   ├── (tabs)/              # bottom navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Inicio (accesos por país/categoría)
│   │   ├── canales.tsx      # catálogo + filtros (país/categoría)
│   │   ├── buscar.tsx       # búsqueda server-side (debounce 300ms)
│   │   ├── favoritos.tsx    # FASE 13
│   │   └── mas.tsx          # logout + versión
│   └── channel/[id].tsx     # stub del reproductor (FASE 14)
├── components/              # channel-card, skeleton, empty/error states
├── hooks/                   # use-channels (paginación infinita), use-catalog
├── lib/                     # api, session, device, activation, flags, types
└── constants/theme.ts       # paleta oscura
```

## API consumida

- `POST /auth/activate` · `GET /auth/session` · `POST /auth/logout` (sesión).
- `GET /channels` (paginado, filtros `country`/`category`/`search`),
  `GET /countries`, `GET /categories`.
- `GET /me/favorites` · `POST/DELETE /me/favorites/:channelId` (favoritos).
- `GET /me/history` · `POST /me/history/:channelId` (historial, máx 20).

### Reproductor (FASE 14)

`channel/[id].tsx` reproduce el `streamUrl` con `expo-video` (`useVideoPlayer`
+ `VideoView`, `nativeControls`, `contentFit="contain"`). HLS se reproduce
nativo (AVPlayer/ExoPlayer). Abrir el canal registra la visualización en
`/me/history`.

### EPG (FASE 15)

El backend sincroniza una guía XMLTV (`EPG_SOURCE_URL`) y expone la
programación protegida por `SessionGuard`:

- `POST /admin/epg/sync` (ADMIN) — parsea XMLTV y persiste programas
  (horizonte ahora → +24 h), mapeando `channel` (tvg-id) → `Channel.externalId`.
- `GET /channels/:id/epg` — programación de un canal (con `isLive`).
- `GET /epg/now` — programas al aire ahora.

La app muestra "Programación" bajo el reproductor (`hooks/use-epg.ts`). Si no
hay EPG, la sección simplemente no aparece (la app funciona igual).

### Caché + offline (FASE 16)

`lib/cache.ts` envuelve AsyncStorage (best-effort, nunca lanza). Países,
categorías y la página 1 del catálogo (sin búsqueda) se cachean con
stale-while-revalidate: se muestra el caché al instante y se refresca en
background. Sin conexión queda el caché y la grilla muestra un banner
"Sin conexión — mostrando catálogo guardado" (`use-channels` expone `offline`).

El cliente desenvuelve el envelope `{ success, data }` /
`{ success: false, error }` (`lib/api.ts`).

## Entorno

`EXPO_PUBLIC_API_URL` (`.env`, gitignored) apunta al backend. En dev local el
backend corre en `:3002` (ver `.env`).

## Comandos

```powershell
npm run start --workspace=infitv-mobile      # Metro
npm run android --workspace=infitv-mobile    # expo start --android
npm run typecheck --workspace=infitv-mobile
npm run lint --workspace=infitv-mobile
```
