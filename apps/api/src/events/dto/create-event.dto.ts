import { IsString, IsOptional, IsInt, IsDateString, IsNumberString, IsObject } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  venue: string;

  @IsDateString()
  date: string;

  @IsInt()
  totalTickets: number;

  @IsNumberString()
  basePrice: string;

  @IsOptional()
  @IsNumberString()
  priceFloor?: string;

  @IsOptional()
  @IsNumberString()
  priceCeiling?: string;

  @IsOptional()
  @IsObject()
  pricingRules?: any;
}
