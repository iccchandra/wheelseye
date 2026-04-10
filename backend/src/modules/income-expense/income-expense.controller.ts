import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IncomeExpenseService } from './income-expense.service';
import { CreateIncomeExpenseDto } from './dto/create-income-expense.dto';

@ApiTags('Income & Expense')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income-expense')
export class IncomeExpenseController {
  constructor(private readonly svc: IncomeExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Create income or expense entry' })
  create(@Body() dto: CreateIncomeExpenseDto) { return this.svc.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List entries with filters' })
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get('report')
  @ApiOperation({ summary: 'Income/expense report with net profit' })
  report(@Query('vehicleId') v: string, @Query('from') f: string, @Query('to') t: string) {
    return this.svc.getReport(v, f, t);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateIncomeExpenseDto>) { return this.svc.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
