import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DB } from '../database/database.module';
import * as schema from '@repo/database';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE_DB) private db: any) {}

  async getEventMetrics(eventId: string) {
    const [event] = await this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId));

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const [metrics] = await this.db
      .select({
        totalSold: sql<number>`sum(case when status = 'confirmed' then quantity else 0 end)`,
        totalRevenue: sql<string>`sum(case when status = 'confirmed' then total_amount else 0 end)`,
        avgPrice: sql<string>`avg(case when status = 'confirmed' then price_paid else null end)`,
      })
      .from(schema.bookings)
      .where(eq(schema.bookings.eventId, eventId));

    return {
      eventId: event.id,
      eventName: event.name,
      totalCapacity: event.totalTickets,
      ticketsRemaining: event.totalTickets - event.bookedTickets,
      totalSold: Number(metrics?.totalSold || 0),
      totalRevenue: metrics?.totalRevenue || "0",
      avgPrice: metrics?.avgPrice || "0",
    };
  }

  async getSystemSummary() {
    const [eventCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.events);

    const [bookingMetrics] = await this.db
      .select({
        totalBookings: sql<number>`count(*)`,
        confirmedBookings: sql<number>`sum(case when status = 'confirmed' then 1 else 0 end)`,
        totalRevenue: sql<string>`sum(case when status = 'confirmed' then total_amount else 0 end)`,
      })
      .from(schema.bookings);

    return {
      totalEvents: eventCount.count,
      totalBookings: Number(bookingMetrics?.totalBookings || 0),
      confirmedBookings: Number(bookingMetrics?.confirmedBookings || 0),
      totalRevenue: bookingMetrics?.totalRevenue || "0",
    };
  }
}
