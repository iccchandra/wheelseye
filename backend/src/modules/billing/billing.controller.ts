import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { InvoiceStatus } from './invoice.model';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  create(@Body() body: any) {
    const { shipmentId, ...extras } = body;
    return this.billingService.createInvoice(shipmentId, extras);
  }

  @Get('invoices')
  getAll(@Query('status') status?: InvoiceStatus, @Query('page') page?: number) {
    return this.billingService.getInvoices({ status, page });
  }

  @Get('invoices/:id')
  getOne(@Param('id') id: string) {
    return this.billingService.getOne(id);
  }

  @Post('invoices/:id/payment')
  createPayment(@Param('id') id: string) {
    return this.billingService.createPaymentOrder(id);
  }

  @Post('invoices/:id/verify')
  verify(@Param('id') id: string, @Body('razorpayPaymentId') paymentId: string) {
    return this.billingService.verifyPayment(id, paymentId);
  }
}
