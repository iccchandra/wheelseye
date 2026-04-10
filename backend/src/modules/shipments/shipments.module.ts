// shipments.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './shipment.model';
import { AlertsModule } from '../alerts/alerts.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SequelizeModule.forFeature([Shipment]), AlertsModule, EmailModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
