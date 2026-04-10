import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { Customer } from '../customers/customer.model';
import { GpsEvent } from '../gps/gps.models';
import { Invoice } from '../billing/invoice.model';

export enum ShipmentStatus {
  INQUIRY    = 'INQUIRY',
  QUOTED     = 'QUOTED',
  BOOKED     = 'BOOKED',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELAYED    = 'DELAYED',
  DELIVERED  = 'DELIVERED',
  CANCELLED  = 'CANCELLED',
}

@Table({ tableName: 'shipments', paranoid: true })
export class Shipment extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column({ type: DataType.ENUM(...Object.values(ShipmentStatus)), defaultValue: ShipmentStatus.INQUIRY })
  status: ShipmentStatus;

  @Column origin: string;
  @Column originLat: number;
  @Column originLng: number;

  @Column destination: string;
  @Column destinationLat: number;
  @Column destinationLng: number;

  @Column({ type: DataType.JSON, defaultValue: [] })
  waypoints: Array<{ lat: number; lng: number; label: string }>;

  @Column cargoDescription: string;
  @Column({ type: DataType.FLOAT }) weightMT: number;
  @Column truckType: string;

  @Column({ type: DataType.DATE }) scheduledPickup: Date;
  @Column({ type: DataType.DATE }) actualPickup: Date;
  @Column({ type: DataType.DATE }) estimatedDelivery: Date;
  @Column({ type: DataType.DATE }) actualDelivery: Date;

  @Column({ type: DataType.FLOAT }) quotedAmount: number;
  @Column({ type: DataType.FLOAT }) finalAmount: number;

  @Column({ defaultValue: false }) insuranceEnabled: boolean;
  @Column({ type: DataType.FLOAT }) insuranceAmount: number;
  @Column({ type: DataType.FLOAT }) insuranceCoverage: number;

  @Column podImageUrl: string;
  @Column podSignatureUrl: string;
  @Column({ type: DataType.DATE }) podCapturedAt: Date;

  @Column({ type: DataType.STRING }) shipperPhone: string;
  @Column({ type: DataType.STRING }) consigneePhone: string;
  @Column({ type: DataType.STRING }) consigneeName: string;

  @Column({ type: DataType.TEXT }) internalNotes: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<string, any>;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID }) vehicleId: string;

  @ForeignKey(() => Driver)
  @Column({ type: DataType.UUID }) driverId: string;

  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID }) customerId: string;

  @BelongsTo(() => Vehicle) vehicle: Vehicle;
  @BelongsTo(() => Driver) driver: Driver;
  @BelongsTo(() => Customer) customer: Customer;
  @HasMany(() => GpsEvent) gpsEvents: GpsEvent[];
  @HasMany(() => Invoice) invoices: Invoice[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
