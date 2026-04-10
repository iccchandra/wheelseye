import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceStatus } from './invoice.model';
import { Shipment } from '../shipments/shipment.model';

@Injectable()
export class BillingService {
  private razorpay: Razorpay;

  constructor(
    @InjectModel(Invoice) private invoiceModel: typeof Invoice,
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: configService.get('RAZORPAY_KEY_ID'),
      key_secret: configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createInvoice(shipmentId: string, extras?: {
    detentionAmount?: number;
    tollAmount?: number;
    otherCharges?: number;
  }): Promise<Invoice> {
    const shipment = await this.shipmentModel.findByPk(shipmentId);
    if (!shipment) throw new NotFoundException('Shipment not found');

    const freight = shipment.finalAmount || shipment.quotedAmount || 0;
    const detention = extras?.detentionAmount || 0;
    const toll = extras?.tollAmount || 0;
    const insurance = shipment.insuranceAmount || 0;
    const other = extras?.otherCharges || 0;
    const subtotal = freight + detention + toll + insurance + other;

    const gstRate = 5;
    const isInterstate = this.isInterstate(shipment.origin, shipment.destination);
    const cgst = isInterstate ? 0 : subtotal * 0.025;
    const sgst = isInterstate ? 0 : subtotal * 0.025;
    const igst = isInterstate ? subtotal * 0.05 : 0;
    const totalAmount = subtotal + cgst + sgst + igst;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return this.invoiceModel.create({
      id: uuidv4(),
      invoiceNumber,
      shipmentId,
      status: InvoiceStatus.DRAFT,
      consigneeName: shipment.consigneeName,
      freightAmount: freight,
      detentionAmount: detention,
      tollAmount: toll,
      insuranceAmount: insurance,
      otherCharges: other,
      subtotal,
      gstRate,
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      igst: parseFloat(igst.toFixed(2)),
      totalAmount,
      hsnCode: '9965',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    } as any);
  }

  async createPaymentOrder(invoiceId: string) {
    const invoice = await this.invoiceModel.findByPk(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const order = await this.razorpay.orders.create({
      amount: Math.round(invoice.totalAmount * 100),
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice.id, shipmentId: invoice.shipmentId },
    });

    await invoice.update({ razorpayOrderId: order.id });
    return { orderId: order.id, amount: order.amount, currency: order.currency };
  }

  async verifyPayment(invoiceId: string, razorpayPaymentId: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findByPk(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    await invoice.update({
      razorpayPaymentId,
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
    });
    return invoice;
  }

  async getInvoices(params: { status?: InvoiceStatus; page?: number; limit?: number }) {
    const { status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where: any = {};
    if (status) where.status = status;

    const { rows, count } = await this.invoiceModel.findAndCountAll({
      where,
      include: [{ model: Shipment, attributes: ['id', 'trackingNumber', 'origin', 'destination'] }],
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return { data: rows, total: count, page, limit };
  }

  async getOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findByPk(id, { include: [Shipment] });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private isInterstate(origin: string, destination: string): boolean {
    const stateMap: Record<string, string> = {
      hyderabad: 'TS', delhi: 'DL', mumbai: 'MH', bangalore: 'KA',
      chennai: 'TN', kolkata: 'WB', ahmedabad: 'GJ', jaipur: 'RJ',
      lucknow: 'UP', chandigarh: 'PB', bhopal: 'MP',
    };
    const o = stateMap[origin.toLowerCase().split(' ')[0]];
    const d = stateMap[destination.toLowerCase().split(' ')[0]];
    return !o || !d || o !== d;
  }
}
