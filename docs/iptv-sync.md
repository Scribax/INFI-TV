# Integración IPTV-org — INFI TV (FASE 8)

Sincroniza el catálogo de canales desde las fuentes públicas de
[IPTV-org](https://github.com/iptv-org/iptv) hacia el modelo propio
(PostgreSQL vía Prisma).

## Fuente

`IPTV_SOURCE_URL` (default `https://iptv-org.github.io/iptv/index.m3u`).
Es el único archivo que se consume: el país se deriva del sufijo `.xx` del
`tvg-id`, las categorías del `group-title`, la bandera del código ISO-2.
No se depende de los JSON (`countries.json`, `categories.json`) que IPTV-org
ya no publica en GitHub Pages.

## Flujo

```text
index.m3u
   ↓ fetch (timeout 30s)
Parser (m3u-parser.ts)
   ↓ parse + validar + deduplicar por calidad
Normalización (countries.ts)
   ↓ upsert seguro
PostgreSQL (Country, Category, Channel)
```

- **Parser** (`m3u-parser.ts`): funciones puras, sin I/O. Extrae `tvg-id`,
  nombre (primera coma fuera de comillas), logo, stream URL, categorías y país.
- **Deduplicación**: IPTV-org lista el mismo canal en varias calidades
  (`@SD`/`@HD`/`@FHD`); se agrupa por `externalId` y se conserva la mejor
  calidad (FHD/4K > HD/1080p > SD/720p).
- **Sync seguro**: si la descarga falla, **no se toca** la DB. Nunca se borran
  canales por una actualización fallida (§18). Upsert incremental.

## Endpoint manual

```
POST /api/v1/admin/iptv/sync   (Bearer, ADMIN+)
```

Respuesta: `{ source, parsed, channels, countries, categories, durationMs }`.
Registra auditoría `admin.synced_iptv`.

## Job programado

`IptvSyncScheduler` corre el sync cada `IPTV_SYNC_CRON` (default `0 */6 * * *`,
es decir cada 6h, timezone Argentina). Deshabilitado por defecto:
activarlo con `IPTV_SYNC_ENABLED=true`.

## Resultado del sync inicial

| Métrica | Valor |
|---------|-------|
| Canales únicos (tras dedup) | ~9.910 |
| Países | 178 |
| Categorías | 29 |
| Duración | ~70s |

## Modelos

`Country` (code, name, flag) · `Category` (slug, name) · `Channel`
(externalId, name, logoUrl, streamUrl, countryCode, categorías m2m,
streamStatus, sourceUpdatedAt). El `streamStatus` queda `UNKNOWN` hasta el
health-check de streams (FASE 19).
