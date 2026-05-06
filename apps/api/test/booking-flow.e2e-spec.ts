import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DRIZZLE_DB } from '../src/database/database.module';
import * as schema from '@repo/database';
import { eq } from 'drizzle-orm';

describe('Booking Flow (e2e)', () => {
  let app: INestApplication;
  let db: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    db = moduleFixture.get(DRIZZLE_DB);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete a full booking lifecycle', async () => {
    // 1. Seed an event
    const [event] = await db.insert(schema.events).values({
      name: 'E2E Test Event',
      venue: 'Main Stage',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalTickets: 100,
      bookedTickets: 0,
      basePrice: '100.00',
      currentPrice: '100.00',
      pricingRules: {},
    }).returning();

    const eventId = event.id;

    // 2. Create Booking
    const createResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        eventId,
        userEmail: 'e2e@example.com',
        quantity: 2,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      status: 'pending',
      quantity: 2,
    });
    const bookingId = createResponse.body.id;

    // Verify event bookedTickets updated
    const [eventAfterBooking] = await db.select().from(schema.events).where(eq(schema.events.id, eventId));
    expect(eventAfterBooking.bookedTickets).toBe(2);

    // 3. Confirm Booking
    const confirmResponse = await request(app.getHttpServer())
      .patch(`/bookings/${bookingId}/confirm`)
      .send();

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.status).toBe('confirmed');
    expect(confirmResponse.body.expiresAt).toBeNull();

    // 4. Verify Fetch Booking
    const getResponse = await request(app.getHttpServer())
      .get(`/bookings/${bookingId}`)
      .send();

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.status).toBe('confirmed');
    expect(getResponse.body.id).toBe(bookingId);
  });
});
