import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateGpsEventDto {
  @IsUUID()         shipmentId: string;
  @IsString()       vehicleId: string;
  @IsNumber()       lat: number;
  @IsNumber()       lng: number;
  @IsOptional() @IsNumber() speed?: number;
  @IsOptional() @IsNumber() heading?: number;
  @IsOptional() @IsNumber() altitude?: number;
  @IsOptional() @IsNumber() accuracy?: number;
  @IsOptional() @IsString() source?: string;
}
