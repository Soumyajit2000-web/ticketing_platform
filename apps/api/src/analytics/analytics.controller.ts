import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('events/:id')
  getEventMetrics(@Param('id') id: string) {
    return this.analyticsService.getEventMetrics(id);
  }

  @Get('summary')
  getSystemSummary() {
    return this.analyticsService.getSystemSummary();
  }
}
