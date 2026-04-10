import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsBoolean, Min } from 'class-validator';

export class CreateFuelDto {
  @IsUUID() vehicleId: string;
  @IsOptional() @IsUUID() driverId?: string;
  @IsNumber() @Min(0.01) quantity: number;
  @IsNumber() @Min(0.01) pricePerUnit: number;
  @IsNumber() @Min(0.01) totalAmount: number;
  @IsOptional() @IsNumber() @Min(0) odometerReading?: number;
  @IsDateString() fillDate: string;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsString() station?: string;
  @IsOptional() @IsString() comments?: string;
  @IsOptional() @IsBoolean() createExpenseEntry?: boolean;
}
