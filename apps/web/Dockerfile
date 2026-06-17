FROM node:20-slim AS builder

ENV COREPACK_ENABLE=0

WORKDIR /app

RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY package.json package-lock.json .
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY apps/web apps/web
COPY apps/api apps/api
COPY packages packages
COPY turbo.json .

RUN npx turbo build --filter=@captagov/web

FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

EXPOSE 3000

WORKDIR /app/apps/web

CMD ["node", "node_modules/next/dist/bin/next", "start"]
