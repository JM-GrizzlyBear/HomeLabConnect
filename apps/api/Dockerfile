# ============================================================
# API Dockerfile — multi-stage build for apps/api
# Build context is the REPO ROOT (see docker-compose.yml).
# ============================================================

# ---------- Stage 1: install deps (cached) ----------
FROM node:20-alpine AS deps
WORKDIR /repo

# Enable pnpm via corepack (ships with Node 20)
RUN corepack enable

# Copy only the manifests first so Docker can cache this layer
# until any package.json changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install ALL workspace deps (needed for the build stage)
RUN pnpm install --frozen-lockfile

# ---------- Stage 2: build TypeScript ----------
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable

# Reuse the node_modules from the deps stage
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Compile API to dist/
RUN pnpm --filter @homelabconnect/api run build

# ---------- Stage 3: minimal runtime image ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root for security
RUN addgroup -S app && adduser -S app -G app

# Copy compiled output + the node_modules needed at runtime
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./node_modules/@homelabconnect/shared

USER app
EXPOSE 4000
CMD ["node", "dist/index.js"]
