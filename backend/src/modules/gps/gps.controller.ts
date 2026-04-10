import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('GPS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Get('position/:vehicleId')
  getLatestPosition(@Param('vehicleId') vehicleId: string) {
    return this.gpsService.getLatestPosition(vehicleId);
  }

  @Get('history/:shipmentId')
  getRouteHistory(
    @Param('shipmentId') shipmentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.gpsService.getRouteHistory(
      shipmentId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('geofences')
  getGeofences() {
    return this.gpsService.getGeofences();
  }

  @Post('geofences')
  createGeofence(@Body() data: any) {
    return this.gpsService.createGeofence(data);
  }

  @Delete('geofences/:id')
  deleteGeofence(@Param('id') id: string) {
    return this.gpsService.deleteGeofence(id);
  }

  @Get('stops/:vehicleId')
  @ApiOperation({ summary: 'Get stop/run segments for a vehicle on a given day' })
  getStopsAndRuns(
    @Param('vehicleId') vehicleId: string,
    @Query('date') date?: string,
  ) {
    return this.gpsService.getStopsAndRuns(vehicleId, date);
  }
}
