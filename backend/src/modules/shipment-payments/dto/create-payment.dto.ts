import { IsUUID, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateShipmentPaymentDto {
  @IsUUID() shipmentId: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() referenceNumber?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() paidAt?: string;
}
