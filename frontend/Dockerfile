# ─── Smart Error Tracker – Frontend Dashboard ────────────────────────────────
# Build context: proje kökü (.)
#   Dockerfile Path: frontend/Dockerfile
# ──────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Bağımlılıklar ──────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS deps

WORKDIR /app

COPY frontend/package.json ./
RUN bun install

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

COPY frontend/ ./

# NOT: NUXT_PUBLIC_API_URL build time'a bakilmez.
# Nuxt 3, NUXT_PUBLIC_* env degiskenlerini runtime'da container ENV'inden okur.
# Dokploy UI'dan Environment Variables sekmesinden set edilmesi yeterli.
RUN bun run build

# ─── Stage 3: Runner (Node.js – Nuxt SSR) ────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

COPY --from=builder /app/.output ./

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "server/index.mjs"]
