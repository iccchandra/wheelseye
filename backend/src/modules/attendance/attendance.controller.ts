import { Controller, Get, Post, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  @Post('mark')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark check-in or check-out (from driver app after QR scan)' })
  markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.svc.markAttendance(dto);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Today\'s attendance summary for admin dashboard' })
  getTodaySummary() {
    return this.svc.getTodaySummary();
  }

  @Get('driver/:driverId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Driver attendance history with hours calculation' })
  getDriverHistory(
    @Param('driverId') driverId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.getDriverHistory(driverId, from, to);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'All attendance records with filters' })
  findAll(@Query() q: any) {
    return this.svc.findAll(q);
  }

  // --- QR endpoints (no auth needed for scan) ---
  @Get('qr/:vehicleId')
  @ApiOperation({ summary: 'Generate QR code for a vehicle (returns base64 data URL)' })
  async getVehicleQR(@Param('vehicleId') vehicleId: string) {
    const qr = await this.svc.generateVehicleQR(vehicleId);
    return { vehicleId, qr };
  }

  @Get('qr/:vehicleId/image')
  @ApiOperation({ summary: 'Generate QR code as PNG image' })
  async getVehicleQRImage(@Param('vehicleId') vehicleId: string, @Res() res: Response) {
    const qr = await this.svc.generateVehicleQR(vehicleId);
    const base64 = qr.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename=vehicle-qr-${vehicleId}.png`);
    res.send(buffer);
  }

  @Get('scan/:vehicleId')
  @ApiOperation({ summary: 'Get vehicle details after QR scan (for driver app)' })
  getVehicleFromScan(@Param('vehicleId') vehicleId: string) {
    return this.svc.getVehicleFromQR(vehicleId);
  }
}
