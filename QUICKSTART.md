# Quickstart Guide

This guide will help you get the Ticketing Platform up and running on your local machine.

## Prerequisites

- **Node.js**: version 18 or higher
- **pnpm**: version 9 or higher
- **Docker**: (Optional, for database or full containerized setup)

---

## 1. Environment Variables

The project uses separate environment variables for the API and Web applications.

### API (`apps/api`)
Copy `.env.example` to `.env`:
```bash
cp apps/api/.env.example apps/api/.env
```
**Key variables:**
- `DATABASE_URL`: Connection string for PostgreSQL.
- `ADMIN_API_KEY`: Secret key for administrative actions.
- `PRICING_WEIGHT_*`: Weights for the dynamic pricing engine (Time, Demand, Inventory).

### Web (`apps/web`)
Copy `.env.example` to `.env`:
```bash
cp apps/web/.env.example apps/web/.env
```
**Key variables:**
- `NEXT_PUBLIC_API_URL`: The URL of the backend API (e.g., `http://localhost:3001`).

### Database (`packages/database`)
If you are running migrations locally from the package directory:
```bash
cp packages/database/.env.example packages/database/.env
```


---

## 2. Local Setup (Recommended for Development)

### Install Dependencies
```bash
pnpm install
```

### Start Database
If you have Docker installed, you can start only the PostgreSQL service:
```bash
docker compose up postgres -d
```

### Setup Database Schema
Run migrations to create the tables and then seed the initial data:
```bash
# Generate and push migrations
pnpm db:push

# OR run existing migrations
pnpm db:migrate

# Seed initial events and data
pnpm db:seed
```

### Run the Project
Start all applications in development mode:
```bash
pnpm dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

---

## 3. Docker Setup (Full Orchestration)

To run the entire stack (Database, API, Web, and Migrator) using Docker Compose:

```bash
docker compose up -d
```

This will:
1. Start a PostgreSQL container.
2. Run database migrations automatically.
3. Start the API server on port 3001.
4. Start the Web application on port 3000.

---

## 4. Running Tests

The project uses `vitest` for testing. You can run tests for the entire monorepo or specific apps.

### Run All Tests
```bash
pnpm test
```

### API Tests (Unit & E2E)
```bash
# Run unit tests
pnpm --filter api test

# Run E2E tests (requires running database)
pnpm --filter api test:e2e

# Run tests with coverage
pnpm --filter api test:cov
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm db:studio` | Open Drizzle Studio to explore the DB |
