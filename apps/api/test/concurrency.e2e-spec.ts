import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DRIZZLE_DB } from '../src/database/database.module';
import * as schema from '@repo/database';
import { eq } from 'drizzle-orm';

describe('Booking Concurrency (e2e)', () => {
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

  it('should prevent overbooking when multiple requests happen simultaneously', async () => {
    // 1. Create an event with only 5 tickets
    const [event] = await db.insert(schema.events).values({
      name: 'Limited Event',
      venue: 'Small Room',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      totalTickets: 5,
      bookedTickets: 0,
      basePrice: '100.00',
      currentPrice: '100.00',
      pricingRules: {},
    }).returning();

    const eventId = event.id;

    // 2. Attempt to book 1 ticket each by 10 different users simultaneously
    const requests = Array.from({ length: 10 }).map((_, i) => 
      request(app.getHttpServer())
        .post('/bookings')
        .send({
          eventId,
          userEmail: `user${i}@example.com`,
          quantity: 1,
        })
    );

    const responses = await Promise.all(requests);

    // 3. Verify results
    const successCount = responses.filter(r => r.status === 201).length;
    const failureCount = responses.filter(r => r.status === 409).length;

    console.log(`Successes: ${successCount}, Failures: ${failureCount}`);

    // Exactly 5 should succeed
    expect(successCount).toBe(5);
    expect(failureCount).toBe(5);

    // 4. Verify DB state
    const [updatedEvent] = await db.select().from(schema.events).where(eq(schema.events.id, eventId));
    expect(updatedEvent.bookedTickets).toBe(5);
  }, 10000);
});
