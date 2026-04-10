import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IncomeExpense } from './income-expense.model';
import { IncomeExpenseController } from './income-expense.controller';
import { IncomeExpenseService } from './income-expense.service';

@Module({
  imports: [SequelizeModule.forFeature([IncomeExpense])],
  controllers: [IncomeExpenseController],
  providers: [IncomeExpenseService],
  exports: [IncomeExpenseService],
})
export class IncomeExpenseModule {}
