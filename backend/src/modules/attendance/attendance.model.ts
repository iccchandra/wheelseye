import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, CreatedAt,
} from 'sequelize-typescript';
import { Driver } from '../drivers/driver.model';
import { Vehicle } from '../vehicles/vehicle.model';

export enum AttendanceType { CHECK_IN = 'CHECK_IN', CHECK_OUT = 'CHECK_OUT' }

@Table({ tableName: 'driver_attendance', updatedAt: false })
export class DriverAttendance extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Driver)
  @Column({ type: DataType.UUID, allowNull: false }) driverId: string;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false }) vehicleId: string;

  @Column({ type: DataType.ENUM(...Object.values(AttendanceType)), allowNull: false })
  type: AttendanceType;

  @Column({ type: DataType.FLOAT, allowNull: false }) lat: number;
  @Column({ type: DataType.FLOAT, allowNull: false }) lng: number;
  @Column address: string;

  @Column selfieUrl: string;

  @Column({ type: DataType.JSON }) vehicleSnapshot: {
    regNumber: string;
    type: string;
    make: string;
    model: string;
  };

  @Column({ type: DataType.STRING }) deviceInfo: string;
  @Column({ type: DataType.FLOAT }) accuracy: number;

  @BelongsTo(() => Driver) driver: Driver;
  @BelongsTo(() => Vehicle) vehicle: Vehicle;

  @CreatedAt createdAt: Date;
}
