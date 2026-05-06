import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingService } from './pricing.service';
import { ConfigService } from '@nestjs/config';

describe('PricingService', () => {
  let service: PricingService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((_key: string, defaultValue: string) => defaultValue),
    };
    service = new PricingService(mockConfigService as ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate base price when no adjustments apply', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {},
    };

    const result = service.calculatePrice(event, 0);
    expect(result.finalPrice).toBe(100);
  });

  it('should apply time adjustment when event is close', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {
        timeThresholds: [{ days: 7, adjustment: 0.2 }],
      },
    };

    const result = service.calculatePrice(event, 0);
    // Adjustment is 0.2 * 0.4 (default weight) = 0.08
    expect(result.finalPrice).toBe(108);
  });

  it('should apply inventory adjustment when low stock', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days out
      totalTickets: 100,
      bookedTickets: 90, // 10% remaining
      pricingRules: {
        inventoryThresholds: [{ remainingPercent: 15, adjustment: 0.5 }],
      },
    };

    const result = service.calculatePrice(event, 0);
    // Adjustment is 0.5 * 0.3 (default weight) = 0.15
    expect(result.finalPrice).toBe(115);
  });

  it('should apply combined pricing rules correctly', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days out
      totalTickets: 100,
      bookedTickets: 95, // 5% remaining
      pricingRules: {
        timeThresholds: [{ days: 7, adjustment: 0.2 }],
        demandThresholds: [{ velocity: 10, adjustment: 0.15 }],
        inventoryThresholds: [{ remainingPercent: 10, adjustment: 0.4 }],
      },
    };

    const result = service.calculatePrice(event, 15); // velocity 15 > 10

    // timeAdjustment = 0.2
    // demandAdjustment = 0.15
    // inventoryAdjustment = 0.4
    // totalMultiplier = 1 + (0.2 * 0.4) + (0.15 * 0.3) + (0.4 * 0.3)
    // totalMultiplier = 1 + 0.08 + 0.045 + 0.12 = 1.245
    // finalPrice = 100 * 1.245 = 124.5
    expect(result.finalPrice).toBe(124.5);
    expect(result.breakdown.totalMultiplier).toBe(1.245);
  });

  it('should respect price floor constraint', () => {
    const event = {
      basePrice: '100.00',
      priceFloor: '110.00',
      date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {},
    };

    const result = service.calculatePrice(event, 0);
    // Calculated price would be 100, but floor is 110
    expect(result.finalPrice).toBe(110);
  });

  it('should respect price ceiling constraint', () => {
    const event = {
      basePrice: '100.00',
      priceCeiling: '105.00',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {
        timeThresholds: [{ days: 7, adjustment: 0.2 }],
      },
    };

    const result = service.calculatePrice(event, 0);
    // Calculated price would be 108, but ceiling is 105
    expect(result.finalPrice).toBe(105);
  });

  it('should handle floor and ceiling interaction', () => {
    const eventHigh = {
      basePrice: '100.00',
      priceCeiling: '110.00',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {
        timeThresholds: [{ days: 7, adjustment: 0.5 }],
      },
    };
    expect(service.calculatePrice(eventHigh, 0).finalPrice).toBe(110);

    const eventLow = {
      basePrice: '100.00',
      priceFloor: '105.00',
      date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {},
    };
    expect(service.calculatePrice(eventLow, 0).finalPrice).toBe(105);
  });

  it('should use default thresholds when pricingRules is empty or partial', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days out
      totalTickets: 100,
      bookedTickets: 90, // 10% remaining
      pricingRules: {}, // Empty
    };

    const result = service.calculatePrice(event, 15); // velocity 15
    // Default time (<=7 days) = 0.2
    // Default demand (>=10) = 0.15
    // Default inventory (<=20%) = 0.25
    // totalMultiplier = 1 + (0.2*0.4) + (0.15*0.3) + (0.25*0.3)
    // totalMultiplier = 1 + 0.08 + 0.045 + 0.075 = 1.2
    // finalPrice = 120
    expect(result.finalPrice).toBe(120);
    expect(result.breakdown.timeAdjustment).toBe(0.2);
    expect(result.breakdown.demandAdjustment).toBe(0.15);
    expect(result.breakdown.inventoryAdjustment).toBe(0.25);
  });
});
