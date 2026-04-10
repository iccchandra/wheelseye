import { Column, Model, Table, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';
import { VehicleGroup } from '../vehicle-groups/vehicle-group.model';

export enum VehicleStatus { AVAILABLE = 'AVAILABLE', ON_TRIP = 'ON_TRIP', MAINTENANCE = 'MAINTENANCE', INACTIVE = 'INACTIVE' }
export enum TruckType { OPEN = 'OPEN', CONTAINER = 'CONTAINER', TRAILER = 'TRAILER', FLATBED = 'FLATBED', MINI = 'MINI', REFRIGERATED = 'REFRIGERATED' }

@Table({ tableName: 'vehicles', paranoid: true })
export class Vehicle extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ unique: true }) regNumber: string;

  @ForeignKey(() => VehicleGroup)
  @Column({ type: DataType.UUID }) groupId: string;
  @BelongsTo(() => VehicleGroup) group: VehicleGroup;
  @Column({ type: DataType.ENUM(...Object.values(TruckType)) }) type: TruckType;
  @Column({ type: DataType.ENUM(...Object.values(VehicleStatus)), defaultValue: VehicleStatus.AVAILABLE }) status: VehicleStatus;
  @Column({ type: DataType.FLOAT }) capacityMT: number;
  @Column make: string;
  @Column model: string;
  @Column year: number;
  @Column ownerName: string;
  @Column ownerPhone: string;
  @Column({ defaultValue: false }) isOwned: boolean;

  @Column rcNumber: string;
  @Column({ type: DataType.DATE }) rcExpiry: Date;
  @Column rcDocUrl: string;
  @Column({ type: DataType.DATE }) insuranceExpiry: Date;
  @Column insuranceDocUrl: string;
  @Column({ type: DataType.DATE }) pollutionExpiry: Date;
  @Column pollutionDocUrl: string;
  @Column({ type: DataType.DATE }) fitnessExpiry: Date;
  @Column fitnessDocUrl: string;
  @Column({ type: DataType.DATE }) permitExpiry: Date;
  @Column permitDocUrl: string;

  @Column({ type: DataType.DATE }) roadTaxExpiry: Date;
  @Column({ type: DataType.DATE }) nationalPermitExpiry: Date;
  @Column({ type: DataType.DATE }) localPermitExpiry: Date;
  @Column insurerName: string;
  @Column bodyType: string;
  @Column dimension: string;
  @Column imeiNumber: string;
  @Column makersClassification: string;
  @Column({ type: DataType.DATE }) registrationDate: Date;
  @Column({ type: DataType.DATE }) manufacturingDate: Date;
  @Column vehicleClassification: string;

  @Column fastTagId: string;
  @Column gpsDeviceId: string;
  @Column({ defaultValue: false }) gpsEnabled: boolean;

  @Column({ type: DataType.FLOAT }) currentLat: number;
  @Column({ type: DataType.FLOAT }) currentLng: number;
  @Column({ type: DataType.DATE }) lastPingAt: Date;
  @Column({ type: DataType.FLOAT }) lastSpeed: number;

  @HasMany(() => Shipment) shipments: Shipment[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
