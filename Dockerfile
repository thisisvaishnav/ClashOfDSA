FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ──────────────────────────────────────────────────────────────────────
# Stage 2: Dependencies — install all workspace deps
# ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json                    ./apps/web/package.json
COPY apps/battle-engine/package.json          ./apps/battle-engine/package.json
COPY apps/worker/package.json                 ./apps/worker/package.json
COPY packages/db/package.json                 ./packages/db/package.json
COPY packages/queue/package.json              ./packages/queue/package.json
COPY packages/types/package.json              ./packages/types/package.json
COPY packages/ui/package.json                 ./packages/ui/package.json
COPY packages/eslint-config/package.json      ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json  ./packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────────────────────────────
# Stage 3: Builder — copy source and build everything
# ──────────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules                        ./node_modules
COPY --from=deps /app/apps/web/node_modules               ./apps/web/node_modules
COPY --from=deps /app/apps/battle-engine/node_modules      ./apps/battle-engine/node_modules
COPY --from=deps /app/apps/worker/node_modules             ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules             ./packages/db/node_modules
COPY --from=deps /app/packages/queue/node_modules          ./packages/queue/node_modules
COPY --from=deps /app/packages/types/node_modules          ./packages/types/node_modules
COPY --from=deps /app/packages/ui/node_modules             ./packages/ui/node_modules

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm turbo run build

# ──────────────────────────────────────────────────────────────────────
# Stage 4a: Web — Next.js standalone server
# ──────────────────────────────────────────────────────────────────────
FROM base AS web

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]

# ──────────────────────────────────────────────────────────────────────
# Stage 4b: Battle Engine — Express + Socket.IO API server
# ──────────────────────────────────────────────────────────────────────
FROM base AS battle-engine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules                          ./node_modules
COPY --from=builder /app/apps/battle-engine/node_modules       ./apps/battle-engine/node_modules
COPY --from=builder /app/packages/db/node_modules              ./packages/db/node_modules
COPY --from=builder /app/packages/queue/node_modules           ./packages/queue/node_modules
COPY --from=builder /app/packages/types/node_modules           ./packages/types/node_modules
COPY --from=builder /app/apps/battle-engine/dist               ./apps/battle-engine/dist
COPY --from=builder /app/packages/db/dist                      ./packages/db/dist
COPY --from=builder /app/packages/db/prisma                    ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json              ./packages/db/package.json
COPY --from=builder /app/packages/queue/dist                   ./packages/queue/dist
COPY --from=builder /app/packages/queue/package.json           ./packages/queue/package.json
COPY --from=builder /app/packages/types/dist                   ./packages/types/dist
COPY --from=builder /app/packages/types/package.json           ./packages/types/package.json
COPY --from=builder /app/apps/battle-engine/package.json       ./apps/battle-engine/package.json
COPY --from=builder /app/package.json                          ./package.json
COPY --from=builder /app/pnpm-workspace.yaml                   ./pnpm-workspace.yaml

EXPOSE 4000

CMD ["node", "apps/battle-engine/dist/index.js"]

# ──────────────────────────────────────────────────────────────────────
# Stage 4c: Worker — BullMQ background job processor
# ──────────────────────────────────────────────────────────────────────
FROM base AS worker

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules                    ./node_modules
COPY --from=builder /app/apps/worker/node_modules        ./apps/worker/node_modules
COPY --from=builder /app/packages/db/node_modules        ./packages/db/node_modules
COPY --from=builder /app/packages/queue/node_modules     ./packages/queue/node_modules
COPY --from=builder /app/packages/types/node_modules     ./packages/types/node_modules
COPY --from=builder /app/apps/worker/dist                ./apps/worker/dist
COPY --from=builder /app/packages/db/dist                ./packages/db/dist
COPY --from=builder /app/packages/db/prisma              ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json        ./packages/db/package.json
COPY --from=builder /app/packages/queue/dist             ./packages/queue/dist
COPY --from=builder /app/packages/queue/package.json     ./packages/queue/package.json
COPY --from=builder /app/packages/types/dist             ./packages/types/dist
COPY --from=builder /app/packages/types/package.json     ./packages/types/package.json
COPY --from=builder /app/apps/worker/package.json        ./apps/worker/package.json
COPY --from=builder /app/package.json                    ./package.json
COPY --from=builder /app/pnpm-workspace.yaml             ./pnpm-workspace.yaml

CMD ["node", "apps/worker/dist/index.js"]

