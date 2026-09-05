# Mobile — INFI TV

App Android (Expo + React Native + Expo Router). El cliente final entra
**solo con un código de activación** y consume la API vía HTTPS (`/api/v1`).
Nunca accede a la DB directamente.

## Stack

- **Expo SDK 57** · **React Native 0.86** · **React 19**
- **Expo Router** (file-based) · **TypeScript strict**
- Dark mode como diseño principal.

## Estructura

```text
apps/mobile/
├── app.json              # config Expo (Android, dark, splash)
├── metro.config.js       # resuelve workspaces del monorepo
├── src/
│   ├── app/              # rutas de expo-router (_layout, index, …)
│   ├── lib/              # api client, sesión (FASE 11+)
│   └── components/       # UI reutilizable (FASE 11+)
└── assets/               # iconos y splash
```

## Comandos

```powershell
npm run start --workspace=infitv-mobile      # expo start (Metro)
npm run android --workspace=infitv-mobile    # expo start --android
npm run typecheck --workspace=infitv-mobile  # tsc --noEmit
npm run lint --workspace=infitv-mobile       # expo lint
```

## Entorno

`EXPO_PUBLIC_API_URL` apunta al backend (default `http://localhost:3000/api/v1`;
en dev local ver `apps/mobile/.env.local` si el backend corre en otro puerto).

## Estado por fase

- **FASE 10** — scaffold del proyecto: rutas base, workspaces `@infitv/*`. ✅
- **FASE 11** — activación por código: pantalla, SecureStore, sesión. ✅
- **FASE 12** — home + catálogo: tabs, grilla, filtros, búsqueda. ✅
- **FASE 13** — favoritos + historial (endpoints /me + UI). ✅
- **FASE 14** — reproductor HLS (`expo-video`). ✅
- **FASE 15** — EPG (guía XMLTV: sync + endpoint + UI). ✅
- **FASE 16** — caché + offline (AsyncStorage, catálogo cacheado). ✅
- **FASE 17** — estadísticas + logs (telemetría en el backend). ✅
- **FASE 18** — seguridad y rate limiting (anti-abuso). ✅
- **FASE 19** — Docker + Nginx. ✅
- **FASE 20** — tests (jest-expo). ✅
- **FASE 21** — CI/CD (GitHub Actions). ✅
- **FASE 22** — EAS Build. ✅
- **FASE 23** — deployment.

## Build (EAS, FASE 22)

```bash
npx eas build -p android --profile preview     # APK de prueba
npx eas build -p android --profile production  # AAB para Play Store
npx eas build -p android --profile development # development client
```

`eas.json` define los perfiles; `android.package` está en `app.json`
(`com.infitv.app`). Requiere cuenta Expo (`eas login`).
