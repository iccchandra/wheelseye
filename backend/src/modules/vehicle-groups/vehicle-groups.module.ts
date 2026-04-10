import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VehicleGroup } from './vehicle-group.model';
import { VehicleGroupsController } from './vehicle-groups.controller';
import { VehicleGroupsService } from './vehicle-groups.service';

@Module({
  imports: [SequelizeModule.forFeature([VehicleGroup])],
  controllers: [VehicleGroupsController],
  providers: [VehicleGroupsService],
  exports: [VehicleGroupsService],
})
export class VehicleGroupsModule {}
