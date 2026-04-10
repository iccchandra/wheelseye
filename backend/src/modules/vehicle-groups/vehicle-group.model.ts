import { Column, Model, Table, DataType, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Vehicle } from '../vehicles/vehicle.model';

@Table({ tableName: 'vehicle_groups' })
export class VehicleGroup extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ allowNull: false, unique: true }) name: string;
  @Column({ type: DataType.TEXT }) description: string;

  @HasMany(() => Vehicle) vehicles: Vehicle[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
