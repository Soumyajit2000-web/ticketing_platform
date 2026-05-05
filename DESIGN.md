# Design Document

## Pricing Algorithm

The dynamic pricing engine uses a **weighted multi-rule system** built around three independent pricing rules — time-based, demand-based, and inventory-based — each producing a percentage adjustment.

**Formula:** `currentPrice = basePrice × (1 + Σ(weight_i × adjustment_i))`

Each rule is implemented as a pure function that receives event data and returns a fractional adjustment (e.g., 0.20 for +20%). The rules use tiered thresholds: the time-based rule escalates as the event date approaches (0% at 30+ days, up to 80% on the day of the event), the demand-based rule reacts to booking velocity in the last hour (0% at low activity, up to 40% during surges), and the inventory-based rule increases price as remaining tickets shrink (0% above 80% capacity, up to 50% below 10%).

Rule weights are configurable via environment variables (`PRICING_WEIGHT_TIME`, `PRICING_WEIGHT_DEMAND`, `PRICING_WEIGHT_INVENTORY`) and default to 0.4/0.3/0.3 respectively. Per-event threshold overrides are stored in a `pricingRules` JSONB column. The final price is clamped between a configurable floor and ceiling to prevent extreme outcomes. This design keeps each rule independently testable while allowing the orchestrator to combine them deterministically.

## Concurrency Solution

Preventing overselling uses a two-phase booking model  "Implicit Status with Expiration" pattern, combined with PostgreSQL's `SELECT ... FOR UPDATE` row-level locking.

**Phase 1 — Reserve:** When a user initiates a booking, we open a database transaction, acquire an exclusive row lock on the event (`SELECT ... FOR UPDATE`), validate availability, insert a booking with `status='pending'` and `expiresAt=now()+10min`, and increment `bookedTickets`. The lock serializes concurrent requests — if two users try to book the last ticket simultaneously, the second transaction blocks until the first commits, then correctly sees the updated count and rejects.

**Phase 2 — Confirm:** The user confirms within the hold window, which transitions `status` from `pending` to `confirmed` and clears `expiresAt`.

**Expiry:** A NestJS `@Cron` job runs every 60 seconds to find `pending` bookings past their `expiresAt`, sets them to `expired`, and decrements `bookedTickets`. This ensures abandoned carts don't permanently lock inventory — a critical improvement over simple instant-commit approaches.

This approach was chosen over optimistic locking (version columns with retries) because it provides stronger guarantees without retry loops, and the reservation hold pattern gives users a fair window to complete their purchase.

## Architecture Decisions

The Turborepo monorepo is structured with a shared `@repo/database` package containing Drizzle ORM schema definitions and the database client, consumed by the NestJS API. The frontend communicates exclusively through REST API calls — it never accesses the database directly. NestJS was chosen for its module/controller/service architecture, which provides clean separation of concerns and built-in dependency injection that simplifies testing (services can be mocked at the module level). Docker Compose provides a single-command PostgreSQL setup.

## Trade-offs

- **Polling over WebSockets** for real-time price updates — simpler to implement, sufficient at 30-second intervals, avoids WebSocket infrastructure complexity
- **Cron-based expiry over Redis TTL** — the Ticketmaster design recommends distributed locks with Redis TTL for production scale, but a cron job is simpler and sufficient for this scope. The tradeoff is up to 60 seconds of lag before expired holds are released
- **No authentication system** — email-based booking lookup keeps the scope focused on pricing and concurrency

## Future Improvements

With more time, I would add: Redis-backed distributed locks with TTL for instant ticket release on expiry, a virtual waiting queue (SSE) for high-demand events, WebSocket-based real-time price streaming, API rate limiting, comprehensive E2E tests with Playwright, and a price history chart showing how prices evolved over time.
