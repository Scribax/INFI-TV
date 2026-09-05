# INFI TV Admin (Next.js). Contexto de build: la RAÍZ del monorepo.
# `docker build -f apps/admin/Dockerfile .`

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/
COPY apps/admin/package.json apps/admin/
RUN npm ci

COPY packages packages
COPY apps/admin apps/admin

RUN npm run build -w @infitv/types -w @infitv/utils \
  && cd apps/admin && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/admin ./apps/admin

EXPOSE 3001
CMD ["sh", "-c", "cd apps/admin && npm run start"]
