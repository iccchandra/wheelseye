import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

@Table({ tableName: 'shipment_payments' })
export class ShipmentPayment extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Shipment)
  @Column({ type: DataType.UUID, allowNull: false }) shipmentId: string;

  @Column({ type: DataType.FLOAT, allowNull: false }) amount: number;
  @Column({ type: DataType.STRING }) paymentMethod: string;
  @Column({ type: DataType.STRING }) referenceNumber: string;
  @Column({ type: DataType.TEXT }) notes: string;
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW }) paidAt: Date;

  @BelongsTo(() => Shipment) shipment: Shipment;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
