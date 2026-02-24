# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS builder

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

# Build zamanı API URL'i (docker-compose'dan ARG olarak gelebilir)
ARG NUXT_PUBLIC_API_URL=http://localhost:3001
ENV NUXT_PUBLIC_API_URL=$NUXT_PUBLIC_API_URL

RUN bun run build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

COPY --from=builder /app/.output ./

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/index.mjs"]
