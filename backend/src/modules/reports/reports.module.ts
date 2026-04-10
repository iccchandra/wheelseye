import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Shipment } from '../shipments/shipment.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { Alert } from '../alerts/alert.model';
import { FuelLog } from '../fuel/fuel.model';
import { IncomeExpense } from '../income-expense/income-expense.model';
import { GeocodingService } from '../../common/geocoding.service';

@Module({
  imports: [SequelizeModule.forFeature([Shipment, Vehicle, Driver, Alert, FuelLog, IncomeExpense])],
  controllers: [ReportsController],
  providers: [ReportsService, GeocodingService],
})
export class ReportsModule {}
