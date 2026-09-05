# Deployment (FASE 19)

## Servicios

`docker-compose.yml` define: **postgres** (16), **redis** (7, opcional), **backend**
(NestJS), **admin** (Next.js) y **nginx** (reverse proxy). Redis queda previsto
para el rate limiting multi-instancia (hoy el anti-abuso es en memoria).

## Nginx (§40)

`deploy/nginx.conf`:

- `/api/*` → backend, `/` → admin.
- HTTPS (certificado a montar en producción vía volumen).
- Headers de seguridad (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`), gzip y rate limiting básico (`/auth/activate` más estricto).

## Dev local

El stack corre fuera de Docker durante el desarrollo:

- Backend `npm run start:dev` en :3002.
- Admin `npm run dev` en :3001.
- Postgres en Docker (`infitv-postgres-dev`, host :5433).

## Producción (VPS)

```bash
# en el VPS, con el .env completo (secretos reales)
docker compose up -d --build
```

Nginx expone 80/443. El backend corre `prisma migrate deploy` al arrancar.

## CloudFront (§41)

NO se usa CloudFront como proxy de streams inicialmente. La arquitectura lo
permite más adelante, solo si es compatible con los derechos de la fuente.
