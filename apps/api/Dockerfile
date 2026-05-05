FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter api build
RUN pnpm deploy --filter api --prod /prod/api

FROM base AS runner
WORKDIR /app
COPY --from=builder /prod/api .
EXPOSE 3001
CMD ["node", "dist/main"]
