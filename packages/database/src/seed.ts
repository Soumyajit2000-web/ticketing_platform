import { client, db, events } from "./index";

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  // await db.delete(events); // Be careful with this in production

  const sampleEvents = [
    {
      name: "Grand Symphony Concert",
      description: "An evening of classical masterpieces.",
      venue: "Royal Albert Hall",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
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
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days out
      totalTickets: 1000,
      bookedTickets: 850,
      basePrice: "75.00",
      currentPrice: "112.50", // Base * 1.5 (inventory/time) - will be calculated by engine
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
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      totalTickets: 200,
      bookedTickets: 190,
      basePrice: "250.00",
      currentPrice: "437.50", // Base * 1.75
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

  await db.insert(events).values(sampleEvents);

  console.log("Seeding complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Seeding failed:");
  console.error(err);
  process.exit(1);
});
