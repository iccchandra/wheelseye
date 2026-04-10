import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DriversService } from './drivers.service';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private svc: DriversService) {}

  @Get()          findAll(@Query() q: any)         { return this.svc.findAll(q); }
  @Get('available') getAvailable()                 { return this.svc.getAvailable(); }
  @Get(':id')     findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post()         create(@Body() dto: any)         { return this.svc.create(dto); }
  @Put(':id')     update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
}
