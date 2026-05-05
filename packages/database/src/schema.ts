import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  venue: varchar("venue", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  totalTickets: integer("total_tickets").notNull(),
  bookedTickets: integer("booked_tickets").notNull().default(0),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  priceFloor: numeric("price_floor", { precision: 10, scale: 2 }),
  priceCeiling: numeric("price_ceiling", { precision: 10, scale: 2 }),
  pricingRules: jsonb("pricing_rules").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, expired
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
