import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_DB } from '../database/database.module';
import * as schema from '@repo/database';

@Injectable()
export class SeedService {
  constructor(@Inject(DRIZZLE_DB) private db: any) {}

  async seed() {
    console.log("Seeding database via API...");

    const sampleEvents = [
      {
        name: "Grand Symphony Concert",
        description: "An evening of classical masterpieces.",
        venue: "Royal Albert Hall",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalTickets: 500,
        bookedTickets: 0,
        basePrice: "100.00",
        currentPrice: "100.00",
        priceFloor: "80.00",
        priceCeiling: "250.00",
        pricingRules: {
          timeThresholds: [
            { days: 30, adjustment: 0 },
            { days: 7, adjustment: 0.2 },
            { days: 1, adjustment: 0.5 },
          ],
          demandThresholds: [
            { velocity: 10, adjustment: 0.15 },
          ],
          inventoryThresholds: [
            { remainingPercent: 20, adjustment: 0.25 },
          ],
        },
      },
      {
        name: "Rock the Stadium",
        description: "High-energy rock concert with top bands.",
        venue: "Wembley Stadium",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalTickets: 1000,
        bookedTickets: 850,
        basePrice: "75.00",
        currentPrice: "112.50",
        priceFloor: "60.00",
        priceCeiling: "300.00",
        pricingRules: {
          timeThresholds: [
            { days: 30, adjustment: 0 },
            { days: 7, adjustment: 0.2 },
            { days: 1, adjustment: 0.5 },
          ],
          demandThresholds: [
            { velocity: 10, adjustment: 0.15 },
          ],
          inventoryThresholds: [
            { remainingPercent: 20, adjustment: 0.25 },
          ],
        },
      },
      {
        name: "Tech Innovation Summit 2026",
        description: "Explore the future of technology.",
        venue: "Convention Center",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        totalTickets: 200,
        bookedTickets: 190,
        basePrice: "250.00",
        currentPrice: "437.50",
        priceFloor: "200.00",
        priceCeiling: "1000.00",
        pricingRules: {
          timeThresholds: [
            { days: 30, adjustment: 0 },
            { days: 7, adjustment: 0.2 },
            { days: 1, adjustment: 0.5 },
          ],
          demandThresholds: [
            { velocity: 10, adjustment: 0.15 },
          ],
          inventoryThresholds: [
            { remainingPercent: 20, adjustment: 0.25 },
          ],
        },
      },
    ];

    await this.db.insert(schema.events).values(sampleEvents);
    return { message: "Seeding complete", count: sampleEvents.length };
  }
}
