FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy all config files needed for pnpm to resolve the workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/database/package.json ./packages/database/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the source code
COPY . .

# Use programmatic migrations (tsx) instead of drizzle-kit CLI to avoid binary resolution issues
CMD ["sh", "-c", "npx tsx packages/database/src/migrate.ts && npx tsx packages/database/src/seed.ts"]
