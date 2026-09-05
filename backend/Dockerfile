# INFI TV Backend (NestJS + Prisma). Contexto de build: la RAÍZ del monorepo.
# `docker build -f backend/Dockerfile .`

FROM node:22-alpine AS build
WORKDIR /app

# Manifests del monorepo para cachear npm ci
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/
COPY backend/package.json backend/
RUN npm ci

# Fuentes
COPY packages packages
COPY backend backend

# Build de paquetes compartidos + backend + client de Prisma
RUN npm run build -w @infitv/types -w @infitv/utils \
  && cd backend && npx nest build && npx prisma generate

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/package.json

EXPOSE 3000
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/main.js"]
