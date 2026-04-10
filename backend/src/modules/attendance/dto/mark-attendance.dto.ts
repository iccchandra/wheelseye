import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, Min, Max } from 'class-validator';
import { AttendanceType } from '../attendance.model';

export class MarkAttendanceDto {
  @IsUUID() driverId: string;
  @IsUUID() vehicleId: string;
  @IsEnum(AttendanceType) type: AttendanceType;
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
  @IsOptional() @IsString() selfieUrl?: string;
  @IsOptional() @IsString() deviceInfo?: string;
  @IsOptional() @IsNumber() accuracy?: number;
}
