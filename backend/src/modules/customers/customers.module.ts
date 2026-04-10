import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Customer } from './customer.model';
import { Shipment } from '../shipments/shipment.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { CustomersController } from './customers.controller';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Customer, Shipment, Vehicle]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({ secret: cfg.get('JWT_SECRET'), signOptions: { expiresIn: '7d' } }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CustomersController, CustomerPortalController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
