import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty() @IsString() origin: string;
  @ApiProperty() @IsNumber() originLat: number;
  @ApiProperty() @IsNumber() originLng: number;
  @ApiProperty() @IsString() destination: string;
  @ApiProperty() @IsNumber() destinationLat: number;
  @ApiProperty() @IsNumber() destinationLng: number;

  @ApiPropertyOptional() @IsOptional() @IsArray() waypoints?: Array<{ lat: number; lng: number; label: string }>;

  @ApiProperty() @IsString() cargoDescription: string;
  @ApiProperty() @IsNumber() @Min(0.1) weightMT: number;
  @ApiProperty() @IsString() truckType: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledPickup?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() estimatedDelivery?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() quotedAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() insuranceEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() insuranceCoverage?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() shipperPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consigneeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consigneePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() internalNotes?: string;
}
