import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GpsGateway } from './gps.gateway';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { GpsEvent, Geofence } from './gps.models';
import { Shipment } from '../shipments/shipment.model';
import { AlertsModule } from '../alerts/alerts.module';
import { GeocodingService } from '../../common/geocoding.service';

@Module({
  imports: [SequelizeModule.forFeature([GpsEvent, Geofence, Shipment]), AlertsModule],
  controllers: [GpsController],
  providers: [GpsGateway, GpsService, GeocodingService],
  exports: [GpsService],
})
export class GpsModule {}
