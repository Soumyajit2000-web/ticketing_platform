import { IsString, IsEmail, IsInt, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  eventId: string;

  @IsEmail()
  userEmail: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}
