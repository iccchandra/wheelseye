import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Shipment } from '../shipments/shipment.model';
import { Invoice } from '../billing/invoice.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';

@Module({
  imports: [SequelizeModule.forFeature([Shipment, Invoice, Vehicle, Driver])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
