import { IsUUID, IsNumber, IsString, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { EntryType } from '../income-expense.model';

export class CreateIncomeExpenseDto {
  @IsOptional() @IsUUID() vehicleId?: string;
  @IsEnum(EntryType) type: EntryType;
  @IsNumber() @Min(0.01) amount: number;
  @IsDateString() date: string;
  @IsString() description: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
}
