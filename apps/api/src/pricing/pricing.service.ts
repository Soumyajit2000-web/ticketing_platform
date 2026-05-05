import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PricingRuleConfig {
  timeThresholds?: { days: number; adjustment: number }[];
  demandThresholds?: { velocity: number; adjustment: number }[];
  inventoryThresholds?: { remainingPercent: number; adjustment: number }[];
}

@Injectable()
export class PricingService {
  constructor(private configService: ConfigService) {}

  calculatePrice(event: any, recentBookingsCount: number) {
    const basePrice = parseFloat(event.basePrice);
    const pricingRules = (event.pricingRules as PricingRuleConfig) || {};
    
    const weightTime = parseFloat(this.configService.get('PRICING_WEIGHT_TIME', '0.4'));
    const weightDemand = parseFloat(this.configService.get('PRICING_WEIGHT_DEMAND', '0.3'));
    const weightInventory = parseFloat(this.configService.get('PRICING_WEIGHT_INVENTORY', '0.3'));

    const timeAdjustment = this.getTimeAdjustment(event.date, pricingRules.timeThresholds);
    const demandAdjustment = this.getDemandAdjustment(recentBookingsCount, pricingRules.demandThresholds);
    const inventoryAdjustment = this.getInventoryAdjustment(event.totalTickets, event.bookedTickets, pricingRules.inventoryThresholds);

    const totalMultiplier = 1 + (
      (timeAdjustment * weightTime) + 
      (demandAdjustment * weightDemand) + 
      (inventoryAdjustment * weightInventory)
    );

    let finalPrice = basePrice * totalMultiplier;

    // Apply floor and ceiling
    if (event.priceFloor) finalPrice = Math.max(finalPrice, parseFloat(event.priceFloor));
    if (event.priceCeiling) finalPrice = Math.min(finalPrice, parseFloat(event.priceCeiling));

    return {
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      basePrice,
      breakdown: {
        timeAdjustment,
        demandAdjustment,
        inventoryAdjustment,
        totalMultiplier: parseFloat(totalMultiplier.toFixed(4)),
      },
      weights: { time: weightTime, demand: weightDemand, inventory: weightInventory },
    };
  }

  private getTimeAdjustment(eventDate: Date, thresholds?: { days: number; adjustment: number }[]) {
    if (!thresholds || thresholds.length === 0) {
      // Default rule if none provided
      thresholds = [
        { days: 30, adjustment: 0 },
        { days: 7, adjustment: 0.2 },
        { days: 1, adjustment: 0.5 },
      ];
    }

    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Find the highest adjustment for which the days threshold is met
    const sortedThresholds = [...thresholds].sort((a, b) => a.days - b.days);
    let adjustment = 0;
    for (const t of sortedThresholds) {
      if (diffDays <= t.days) {
        adjustment = Math.max(adjustment, t.adjustment);
      }
    }
    return adjustment;
  }

  private getDemandAdjustment(velocity: number, thresholds?: { velocity: number; adjustment: number }[]) {
    if (!thresholds || thresholds.length === 0) {
      thresholds = [{ velocity: 10, adjustment: 0.15 }];
    }

    const sortedThresholds = [...thresholds].sort((a, b) => b.velocity - a.velocity);
    for (const t of sortedThresholds) {
      if (velocity >= t.velocity) return t.adjustment;
    }
    return 0;
  }

  private getInventoryAdjustment(total: number, booked: number, thresholds?: { remainingPercent: number; adjustment: number }[]) {
    if (!thresholds || thresholds.length === 0) {
      thresholds = [{ remainingPercent: 20, adjustment: 0.25 }];
    }

    const remaining = total - booked;
    const remainingPercent = (remaining / total) * 100;

    const sortedThresholds = [...thresholds].sort((a, b) => a.remainingPercent - b.remainingPercent);
    for (const t of sortedThresholds) {
      if (remainingPercent <= t.remainingPercent) return t.adjustment;
    }
    return 0;
  }
}
