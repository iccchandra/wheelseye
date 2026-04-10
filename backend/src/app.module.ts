import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { GpsModule } from './modules/gps/gps.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { BillingModule } from './modules/billing/billing.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { IncomeExpenseModule } from './modules/income-expense/income-expense.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { VehicleGroupsModule } from './modules/vehicle-groups/vehicle-groups.module';
import { ShipmentPaymentsModule } from './modules/shipment-payments/shipment-payments.module';
import { UsersModule } from './modules/users/users.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadModels: true,
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ShipmentsModule,
    VehiclesModule,
    DriversModule,
    GpsModule,
    AlertsModule,
    BillingModule,
    DocumentsModule,
    ReportsModule,
    FuelModule,
    IncomeExpenseModule,
    RemindersModule,
    CustomersModule,
    SettingsModule,
    VehicleGroupsModule,
    ShipmentPaymentsModule,
    UsersModule,
    UploadsModule,
    EmailModule,
  ],
})
export class AppModule {}
