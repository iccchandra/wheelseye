import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ShipmentPayment } from './shipment-payment.model';
import { Shipment } from '../shipments/shipment.model';
import { ShipmentPaymentsController } from './shipment-payments.controller';
import { ShipmentPaymentsService } from './shipment-payments.service';

@Module({
  imports: [SequelizeModule.forFeature([ShipmentPayment, Shipment])],
  controllers: [ShipmentPaymentsController],
  providers: [ShipmentPaymentsService],
  exports: [ShipmentPaymentsService],
})
export class ShipmentPaymentsModule {}
