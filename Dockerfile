FROM oven/bun:1 AS setup
WORKDIR /app
ENV NODE_ENV=development
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=setup /app .
CMD ["sh", "-c", "bun run packages/server/src/db/migrate.ts && bun run packages/server/src/index.ts"]
