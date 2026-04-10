import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';

@Table({ tableName: 'fuel_logs', paranoid: true })
export class FuelLog extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false }) vehicleId: string;

  @ForeignKey(() => Driver)
  @Column({ type: DataType.UUID }) driverId: string;

  @Column({ type: DataType.FLOAT, allowNull: false }) quantity: number;
  @Column({ type: DataType.FLOAT, allowNull: false }) pricePerUnit: number;
  @Column({ type: DataType.FLOAT, allowNull: false }) totalAmount: number;
  @Column({ type: DataType.FLOAT }) odometerReading: number;
  @Column({ type: DataType.DATE, allowNull: false }) fillDate: Date;
  @Column({ type: DataType.STRING }) fuelType: string;
  @Column({ type: DataType.STRING }) station: string;
  @Column({ type: DataType.TEXT }) comments: string;
  @Column({ defaultValue: false }) createExpenseEntry: boolean;

  @BelongsTo(() => Vehicle) vehicle: Vehicle;
  @BelongsTo(() => Driver) driver: Driver;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
