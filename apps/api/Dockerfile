# ==================== Build Stage ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma requires these for binary compilation
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --ignore-scripts
RUN npx prisma generate

COPY . .
RUN npm run build

# ==================== Production Stage ====================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
