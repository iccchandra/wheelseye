import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateReminderDto {
  @IsUUID() vehicleId: string;
  @IsDateString() dueDate: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
}
