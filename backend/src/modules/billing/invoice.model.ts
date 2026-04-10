import { Column, Model, Table, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

export enum InvoiceStatus { DRAFT = 'DRAFT', SENT = 'SENT', PAID = 'PAID', OVERDUE = 'OVERDUE', CANCELLED = 'CANCELLED' }

@Table({ tableName: 'invoices', paranoid: true })
export class Invoice extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 }) id: string;

  @Column({ unique: true }) invoiceNumber: string;

  @ForeignKey(() => Shipment)
  @Column({ type: DataType.UUID }) shipmentId: string;

  @BelongsTo(() => Shipment) shipment: Shipment;

  @Column({ type: DataType.ENUM(...Object.values(InvoiceStatus)), defaultValue: InvoiceStatus.DRAFT }) status: InvoiceStatus;

  @Column shipperName: string;
  @Column shipperGstin: string;
  @Column shipperAddress: string;

  @Column consigneeName: string;
  @Column consigneeGstin: string;
  @Column consigneeAddress: string;

  @Column({ type: DataType.FLOAT }) freightAmount: number;
  @Column({ type: DataType.FLOAT, defaultValue: 0 }) detentionAmount: number;
  @Column({ type: DataType.FLOAT, defaultValue: 0 }) tollAmount: number;
  @Column({ type: DataType.FLOAT, defaultValue: 0 }) insuranceAmount: number;
  @Column({ type: DataType.FLOAT, defaultValue: 0 }) otherCharges: number;

  @Column({ type: DataType.FLOAT }) subtotal: number;
  @Column({ type: DataType.FLOAT, defaultValue: 5 }) gstRate: number;
  @Column cgst: string;
  @Column sgst: string;
  @Column igst: string;
  @Column({ type: DataType.FLOAT }) totalAmount: number;

  @Column hsnCode: string;
  @Column sacCode: string;

  @Column razorpayOrderId: string;
  @Column razorpayPaymentId: string;
  @Column({ type: DataType.DATE }) paidAt: Date;

  @Column({ type: DataType.DATE }) dueDate: Date;
  @Column ({ type: DataType.DATE }) invoiceDate: Date;
  @Column pdfUrl: string;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
