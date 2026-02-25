# ─── Smart Error Tracker – SDK ────────────────────────────────────────────────
# Kullanım (standalone):
#   docker build -t smart-error-tracker-sdk .
#   docker run --rm -v $(pwd)/dist:/app/dist smart-error-tracker-sdk
# ──────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Bağımlılıklar ──────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS deps

WORKDIR /app

COPY package.json ./
RUN bun install

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

COPY . .
RUN bun run build

# ─── Stage 3: Artifact (sadece dist/ içerir) ─────────────────────────────────
FROM scratch AS artifact

COPY --from=builder /app/dist /dist
