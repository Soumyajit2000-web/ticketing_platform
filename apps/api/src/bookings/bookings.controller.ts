import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(id);
  }

  @Get()
  findAll(@Query('eventId') eventId?: string, @Query('email') email?: string) {
    if (eventId) {
      return this.bookingsService.findByEvent(eventId);
    }
    if (email) {
      return this.bookingsService.findByEmail(email);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}
