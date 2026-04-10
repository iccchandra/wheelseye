import {
  Column, Model, Table, DataType,
  HasMany, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

@Table({ tableName: 'customers', paranoid: true })
export class Customer extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ allowNull: false }) name: string;
  @Column({ unique: true }) email: string;
  @Column({ allowNull: false }) phone: string;
  @Column({ type: DataType.TEXT }) address: string;
  @Column gstin: string;
  @Column({ type: DataType.STRING }) password: string;
  @Column({ defaultValue: true }) isActive: boolean;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<string, any>;

  @HasMany(() => Shipment) shipments: Shipment[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
