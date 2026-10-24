# The API for Render. The website is built and hosted by Netlify (netlify.toml).
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
# The API and what it depends on (the shared package)
RUN pnpm exec turbo run build --filter=@homelabconnect/api...

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production

# Installed packages (pnpm keeps them in the root node_modules)
COPY --from=build /app/node_modules ./node_modules

# Shared package: compiled code only
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# API: compiled code + migrations
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle

WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "(async () => { try { const res = await fetch('http://localhost:' + (process.env.PORT || 4000) + '/api/health'); process.exit(res.ok ? 0 : 1); } catch { process.exit(1); } })()"

# Apply new migrations, then start the API
CMD ["sh", "-c", "node dist/migrate.js && node dist/main.js"]
