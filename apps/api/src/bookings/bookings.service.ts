import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DB } from '../database/database.module';
import * as schema from '@repo/database';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { PricingService } from '../pricing/pricing.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BookingsService {
  constructor(
    @Inject(DRIZZLE_DB) private db: any,
    private pricingService: PricingService,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const { eventId, userEmail, quantity } = createBookingDto;

    return await this.db.transaction(async (tx) => {
      // 1. Acquire row-level lock on the event
      const [event] = await tx
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .for('update');

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // 2. Check true availability (confirmed + non-expired pending)
      const remaining = event.totalTickets - event.bookedTickets;
      if (remaining < quantity) {
        throw new ConflictException(`Not enough tickets available. Remaining: ${remaining}`);
      }

      // 3. Calculate current price
      const recentBookingsCount = await this.getRecentBookingsCount(tx, eventId);
      const pricing = this.pricingService.calculatePrice(event, recentBookingsCount);

      // 4. Create pending booking with 10 min expiry
      const [booking] = await tx
        .insert(schema.bookings)
        .values({
          eventId,
          userEmail,
          quantity,
          status: 'pending',
          pricePaid: pricing.finalPrice.toString(),
          totalAmount: (pricing.finalPrice * quantity).toString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        })
        .returning();

      // 5. Increment bookedTickets (counts toward occupancy)
      await tx
        .update(schema.events)
        .set({ 
          bookedTickets: event.bookedTickets + quantity,
          currentPrice: pricing.finalPrice.toString() // Update snapshot
        })
        .where(eq(schema.events.id, eventId));

      return booking;
    });
  }

  async confirm(id: string) {
    return await this.db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, id))
        .for('update');

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      if (booking.status !== 'pending') {
        throw new ConflictException(`Booking status is ${booking.status}, cannot confirm`);
      }

      if (booking.expiresAt && booking.expiresAt < new Date()) {
        throw new ConflictException('Booking has expired');
      }

      const [updatedBooking] = await tx
        .update(schema.bookings)
        .set({ status: 'confirmed', expiresAt: null })
        .where(eq(schema.bookings.id, id))
        .returning();

      return updatedBooking;
    });
  }

  async findByEmail(email: string) {
    return await this.db
      .select({
        id: schema.bookings.id,
        quantity: schema.bookings.quantity,
        status: schema.bookings.status,
        pricePaid: schema.bookings.pricePaid,
        totalAmount: schema.bookings.totalAmount,
        createdAt: schema.bookings.createdAt,
        eventName: schema.events.name,
        eventDate: schema.events.date,
      })
      .from(schema.bookings)
      .innerJoin(schema.events, eq(schema.bookings.eventId, schema.events.id))
      .where(eq(schema.bookings.userEmail, email));
  }

  async findByEvent(eventId: string) {
    return await this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.eventId, eventId));
  }

  async findOne(id: string) {
    const [booking] = await this.db
      .select({
        id: schema.bookings.id,
        eventId: schema.bookings.eventId,
        userEmail: schema.bookings.userEmail,
        quantity: schema.bookings.quantity,
        status: schema.bookings.status,
        pricePaid: schema.bookings.pricePaid,
        totalAmount: schema.bookings.totalAmount,
        expiresAt: schema.bookings.expiresAt,
        createdAt: schema.bookings.createdAt,
        eventName: schema.events.name,
        eventDate: schema.events.date,
      })
      .from(schema.bookings)
      .innerJoin(schema.events, eq(schema.bookings.eventId, schema.events.id))
      .where(eq(schema.bookings.id, id));

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiry() {
    console.log('Running booking expiry cleanup...');
    const now = new Date();

    await this.db.transaction(async (tx) => {
      // Find expired pending bookings
      const expiredBookings = await tx
        .select()
        .from(schema.bookings)
        .where(
          and(
            eq(schema.bookings.status, 'pending'),
            lt(schema.bookings.expiresAt, now)
          )
        )
        .for('update');

      for (const booking of expiredBookings) {
        // Mark as expired
        await tx
          .update(schema.bookings)
          .set({ status: 'expired' })
          .where(eq(schema.bookings.id, booking.id));

        // Release tickets
        await tx
          .update(schema.events)
          .set({
            bookedTickets: sql`${schema.events.bookedTickets} - ${booking.quantity}`
          })
          .where(eq(schema.events.id, booking.eventId));
          
        console.log(`Expired booking ${booking.id} and released ${booking.quantity} tickets`);
      }
    });
  }

  private async getRecentBookingsCount(tx: any, eventId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [result] = await tx
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
