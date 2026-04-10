import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ShipmentPayment } from './shipment-payment.model';
import { Shipment } from '../shipments/shipment.model';
import { CreateShipmentPaymentDto } from './dto/create-payment.dto';

@Injectable()
export class ShipmentPaymentsService {
  constructor(
    @InjectModel(ShipmentPayment) private model: typeof ShipmentPayment,
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
  ) {}

  async create(dto: CreateShipmentPaymentDto): Promise<ShipmentPayment> {
    const shipment = await this.shipmentModel.findByPk(dto.shipmentId);
    if (!shipment) throw new NotFoundException('Shipment not found');
    return this.model.create(dto as any);
  }

  async findByShipment(shipmentId: string) {
    const payments = await this.model.findAll({
      where: { shipmentId },
      order: [['paidAt', 'DESC']],
    });
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const shipment = await this.shipmentModel.findByPk(shipmentId);
    const totalAmount = shipment?.finalAmount || shipment?.quotedAmount || 0;
    return { payments, totalPaid, totalAmount, balance: totalAmount - totalPaid };
  }

  async remove(id: string): Promise<void> {
    const p = await this.model.findByPk(id);
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    await p.destroy();
  }
}
