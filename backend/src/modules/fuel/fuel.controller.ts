import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/create-fuel.dto';

@ApiTags('Fuel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fuel')
export class FuelController {
  constructor(private readonly svc: FuelService) {}

  @Post()
  @ApiOperation({ summary: 'Log a fuel fill-up' })
  create(@Body() dto: CreateFuelDto) { return this.svc.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List fuel logs with filters' })
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get('report')
  @ApiOperation({ summary: 'Fuel consumption report' })
  report(@Query('vehicleId') v: string, @Query('from') f: string, @Query('to') t: string) {
    return this.svc.getReport(v, f, t);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFuelDto>) { return this.svc.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
