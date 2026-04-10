import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ShipmentPaymentsService } from './shipment-payments.service';
import { CreateShipmentPaymentDto } from './dto/create-payment.dto';

@ApiTags('Shipment Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipment-payments')
export class ShipmentPaymentsController {
  constructor(private readonly svc: ShipmentPaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a payment against a shipment' })
  create(@Body() dto: CreateShipmentPaymentDto) { return this.svc.create(dto); }

  @Get('shipment/:shipmentId')
  @ApiOperation({ summary: 'Get payments for a shipment with balance' })
  findByShipment(@Param('shipmentId') id: string) { return this.svc.findByShipment(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
