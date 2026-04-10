import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum UserRole { ADMIN = 'ADMIN', OPS = 'OPS', SHIPPER = 'SHIPPER', TRANSPORTER = 'TRANSPORTER' }

export class CreateUserDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() permissions?: Record<string, boolean>;
}
