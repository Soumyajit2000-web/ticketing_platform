# Design Document — Event Ticketing Platform

## Overview

A full-stack event ticketing platform featuring a dynamic pricing engine that adjusts ticket prices in real-time based on temporal proximity, booking velocity, and remaining inventory. Built as a Turborepo monorepo with a NestJS API, Next.js 15 frontend, and PostgreSQL via Drizzle ORM.

## Pricing Algorithm

The pricing engine uses a **weighted multi-rule system** with three independent rules, each returning a fractional adjustment:

**Formula:** `currentPrice = basePrice × (1 + Σ(weight_i × adjustment_i))`

- **Time-based:** Escalates as the event approaches — default thresholds of +0% at 30+ days, +20% within 7 days, +50% within 1 day.
- **Demand-based:** Reacts to booking velocity (sum of ticket quantities in the last hour) — default +15% when ≥10 tickets booked in the last hour.
- **Inventory-based:** Triggers when remaining inventory drops — default +25% when ≤20% of tickets remain.

Rule weights are configurable via environment variables (`PRICING_WEIGHT_TIME=0.4`, `PRICING_WEIGHT_DEMAND=0.3`, `PRICING_WEIGHT_INVENTORY=0.3`). Per-event threshold overrides are stored in a `pricingRules` JSONB column. The final price is clamped between configurable floor and ceiling values. Each rule is implemented as a pure function, making the calculation fully deterministic and independently testable.

## Concurrency Solution

Preventing overselling uses **PostgreSQL `SELECT ... FOR UPDATE` row-level locking** within a two-phase booking model:

1. **Reserve** (`POST /bookings`): Opens a transaction, acquires an exclusive row lock on the event, validates availability, inserts a `pending` booking with a 10-minute expiry, and increments `bookedTickets`. The lock serializes concurrent requests — if two users compete for the last ticket, the second transaction blocks until the first commits.
2. **Confirm** (`PATCH /bookings/:id/confirm`): Transitions status to `confirmed` within the hold window.
3. **Expiry** (`@Cron` every 60s): Finds expired `pending` bookings, marks them `expired`, and decrements `bookedTickets` to release inventory.

This was chosen over optimistic locking (version columns with retries) because it provides stronger guarantees without retry loops, and the hold pattern gives users a fair window to complete their purchase.

## Architecture Decisions

The monorepo has three layers: `@repo/database` (shared Drizzle schema and client), `apps/api` (NestJS with DI), and `apps/web` (Next.js 15 with Server Components). The frontend communicates exclusively via REST. `POST /events` is protected by an `ApiKeyGuard` (header-based `x-api-key`). Docker Compose orchestrates PostgreSQL, a migrator service (runs migrations before API start), the API, and the web app — with health checks and dependency ordering for reliable cold-start.

## Trade-offs

- **Polling over WebSockets** for price updates — simpler, 30s intervals are sufficient
- **Cron-based expiry over Redis TTL** — up to 60s lag before expired holds release, but avoids Redis infrastructure
- **Email-only identification** — no auth system; keeps scope focused on pricing and concurrency
- **`/bookings/[id]` over `/bookings/success`** — dynamic route enables confirm/expire states on one page

## Future Improvements

Redis-backed distributed locks with TTL for instant ticket release, WebSocket real-time pricing, API rate limiting, Playwright E2E tests, and a price history visualization.
