FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build dependencies and the API
RUN npx turbo build --filter=api

# Deploy only the api
RUN pnpm deploy --filter api --prod /prod/api

FROM base AS runner
WORKDIR /app
COPY --from=builder /prod/api .
EXPOSE 3001
CMD ["node", "dist/main"]
