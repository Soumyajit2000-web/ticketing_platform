import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DB } from '../database/database.module';
import * as schema from '@repo/database';
import { eq, sql, and, gte, lt } from 'drizzle-orm';
import { PricingService } from '../pricing/pricing.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DRIZZLE_DB) private db: any,
    private pricingService: PricingService,
  ) {}

  async findAll() {
    const events = await this.db.select().from(schema.events);
    
    // For each event, calculate current price and recent bookings
    const eventsWithPricing = await Promise.all(events.map(async (event) => {
      const recentBookingsCount = await this.getRecentBookingsCount(event.id);
      const pricing = this.pricingService.calculatePrice(event, recentBookingsCount);
      return {
        ...event,
        currentPrice: pricing.finalPrice.toString(),
        pricing,
        remainingTickets: event.totalTickets - event.bookedTickets,
      };
    }));

    return eventsWithPricing;
  }

  async findOne(id: string) {
    const [event] = await this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const recentBookingsCount = await this.getRecentBookingsCount(id);
    const pricing = this.pricingService.calculatePrice(event, recentBookingsCount);

    return {
      ...event,
      currentPrice: pricing.finalPrice.toString(),
      pricing,
      remainingTickets: event.totalTickets - event.bookedTickets,
    };
  }

  async create(createEventDto: CreateEventDto) {
    const [newEvent] = await this.db
      .insert(schema.events)
      .values({
        ...createEventDto,
        date: new Date(createEventDto.date),
        currentPrice: createEventDto.basePrice,
      })
      .returning();

    return newEvent;
  }

  private async getRecentBookingsCount(eventId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [result] = await this.db
      .select({ count: sql<number>`COALESCE(sum(${schema.bookings.quantity}), 0)` })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.eventId, eventId),
          gte(schema.bookings.createdAt, oneHourAgo)
        )
      );
    return Number(result.count);
  }
}
