import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Vehicle } from '../vehicles/vehicle.model';

@Table({ tableName: 'reminders' })
export class Reminder extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false }) vehicleId: string;

  @Column({ type: DataType.DATE, allowNull: false }) dueDate: Date;
  @Column({ type: DataType.STRING, allowNull: false }) title: string;
  @Column({ type: DataType.TEXT }) description: string;
  @Column({ type: DataType.STRING }) category: string;
  @Column({ defaultValue: false }) isRead: boolean;
  @Column({ type: DataType.DATE }) readAt: Date;

  @BelongsTo(() => Vehicle) vehicle: Vehicle;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
