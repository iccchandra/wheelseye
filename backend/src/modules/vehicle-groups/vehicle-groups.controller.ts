import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VehicleGroupsService } from './vehicle-groups.service';

@ApiTags('Vehicle Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicle-groups')
export class VehicleGroupsController {
  constructor(private readonly svc: VehicleGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vehicle group' })
  create(@Body() body: { name: string; description?: string }) { return this.svc.create(body); }

  @Get()
  @ApiOperation({ summary: 'List all vehicle groups' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) { return this.svc.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
