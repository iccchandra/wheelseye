import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('otdr')
  @ApiOperation({ summary: 'On-Time Delivery Rate by period' })
  getOTDR(@Query('from') from?: string, @Query('to') to?: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    return this.reportsService.getOTDR(f, t);
  }

  @Get('lanes')
  @ApiOperation({ summary: 'Lane performance — cost, time, incidents per route' })
  getLanePerformance(@Query('from') from?: string, @Query('to') to?: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    return this.reportsService.getLanePerformance(f, t);
  }

  @Get('carriers')
  @ApiOperation({ summary: 'Carrier / vehicle scorecard' })
  getCarrierScorecard(@Query('from') from?: string, @Query('to') to?: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    return this.reportsService.getCarrierScorecard(f, t);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Executive summary — weekly snapshot' })
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('fuel')
  @ApiOperation({ summary: 'Fuel consumption report' })
  getFuelReport(@Query('from') from?: string, @Query('to') to?: string, @Query('vehicleId') vehicleId?: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    return this.reportsService.getFuelReport(f, t, vehicleId);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Trip/booking report' })
  getTripReport(@Query('from') from?: string, @Query('to') to?: string, @Query('vehicleId') vehicleId?: string) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    return this.reportsService.getTripReport(f, t, vehicleId);
  }

  @Get('ie-chart')
  @ApiOperation({ summary: 'Income/expense chart data (last N days)' })
  getIEChart(@Query('days') days?: number) {
    return this.reportsService.getIncomeExpenseChart(days || 7);
  }

  @Get('vehicle-locations')
  @ApiOperation({ summary: 'Vehicle locations with reverse-geocoded addresses' })
  getVehicleLocations() {
    return this.reportsService.getVehicleLocations();
  }

  @Get('geofence-events')
  @ApiOperation({ summary: 'Recent geofence events' })
  getGeofenceEvents(@Query('limit') limit?: number) {
    return this.reportsService.getGeofenceEvents(limit || 20);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export shipments as Excel' })
  async exportExcel(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const f = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const t = to   ? new Date(to)   : new Date();
    const buffer = await this.reportsService.exportExcel('shipments', f, t);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=shipments-${Date.now()}.xlsx`);
    res.send(buffer);
  }
}
