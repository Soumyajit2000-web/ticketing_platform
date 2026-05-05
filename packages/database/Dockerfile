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

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Use programmatic migrations (tsx) instead of drizzle-kit CLI to avoid binary resolution issues
CMD ["sh", "-c", "npx tsx packages/database/src/migrate.ts && npx tsx packages/database/src/seed.ts"]
