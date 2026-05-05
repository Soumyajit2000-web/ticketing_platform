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

  it('should apply demand adjustment when velocity is high', () => {
    const event = {
      basePrice: '100.00',
      date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days out
      totalTickets: 100,
      bookedTickets: 0,
      pricingRules: {
        demandThresholds: [{ velocity: 10, adjustment: 0.2 }],
      },
    };

    const result = service.calculatePrice(event, 15); // Velocity of 15 > 10
    // Adjustment is 0.2 * 0.3 (default weight) = 0.06
    expect(result.finalPrice).toBe(106);
  });
});
