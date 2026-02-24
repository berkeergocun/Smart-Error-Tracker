# ─── Stage 1: SDK Build ───────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS sdk-builder

WORKDIR /app/sdk

COPY sdk/package.json ./
RUN bun install

COPY sdk/ ./
RUN bun run build

# ─── Stage 2: Backend Dependencies ───────────────────────────────────────────
FROM oven/bun:1.3-slim AS deps

WORKDIR /app/backend

COPY backend/package.json ./
RUN bun install --production

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS runner

WORKDIR /app/backend

# Backend kaynak kodu
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend/ ./

# SDK dist dosyaları (backend /analytic/index.js ve /sdk.js için erişir)
COPY --from=sdk-builder /app/sdk/dist /app/sdk/dist

EXPOSE 3001
ENV NODE_ENV=production

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD bun -e "fetch('http://localhost:3001/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
