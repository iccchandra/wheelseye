import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentStatus } from './shipment.model';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService } from '../email/email.service';

@ApiTags('Shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new shipment inquiry' })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all shipments with filters' })
  findAll(
    @Query('status') status?: ShipmentStatus,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.shipmentsService.findAll({ status, vehicleId, driverId, search, page, limit });
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Get dashboard fleet stats' })
  getDashboardStats() {
    return this.shipmentsService.getDashboardStats();
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Public tracking by tracking number' })
  findByTracking(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.findByTracking(trackingNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShipmentStatus,
  ) {
    return this.shipmentsService.updateStatus(id, status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign vehicle and driver' })
  assign(
    @Param('id') id: string,
    @Body('vehicleId') vehicleId: string,
    @Body('driverId') driverId: string,
  ) {
    return this.shipmentsService.assignVehicleDriver(id, vehicleId, driverId);
  }

  @Patch(':id/pod')
  @ApiOperation({ summary: 'Upload proof of delivery' })
  uploadPOD(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @Body('signatureUrl') signatureUrl?: string,
  ) {
    return this.shipmentsService.uploadPOD(id, imageUrl, signatureUrl);
  }

  @Post(':id/email/booking')
  @ApiOperation({ summary: 'Send booking confirmation email to consignee' })
  async sendBookingEmail(@Param('id') id: string) {
    const shipment = await this.shipmentsService.findOne(id);
    const email = shipment.consigneePhone?.includes('@') ? shipment.consigneePhone : shipment.customer?.email;
    if (!email) return { sent: false, reason: 'No email address found' };
    const sent = await this.emailService.sendBookingConfirmation(email, shipment);
    return { sent, email };
  }

  @Post(':id/email/tracking')
  @ApiOperation({ summary: 'Send tracking link email to consignee' })
  async sendTrackingEmail(@Param('id') id: string) {
    const shipment = await this.shipmentsService.findOne(id);
    const email = shipment.consigneePhone?.includes('@') ? shipment.consigneePhone : shipment.customer?.email;
    if (!email) return { sent: false, reason: 'No email address found' };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const sent = await this.emailService.sendTrackingLink(email, shipment, frontendUrl);
    return { sent, email };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
