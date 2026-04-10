import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriverAttendance } from './attendance.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { GeocodingService } from '../../common/geocoding.service';

@Module({
  imports: [SequelizeModule.forFeature([DriverAttendance, Vehicle, Driver])],
  controllers: [AttendanceController],
  providers: [AttendanceService, GeocodingService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
