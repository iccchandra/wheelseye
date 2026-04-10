import { Column, Model, Table, DataType, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

@Table({ tableName: 'gps_events', updatedAt: false })
export class GpsEvent extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 }) id: string;
  @ForeignKey(() => Shipment)
  @Column({ type: DataType.UUID }) shipmentId: string;
  @Column vehicleId: string;
  @Column({ type: DataType.FLOAT, allowNull: false }) lat: number;
  @Column({ type: DataType.FLOAT, allowNull: false }) lng: number;
  @Column({ type: DataType.FLOAT }) speed: number;
  @Column({ type: DataType.FLOAT }) heading: number;
  @Column({ type: DataType.FLOAT }) altitude: number;
  @Column({ type: DataType.FLOAT }) accuracy: number;
  @Column({ type: DataType.ENUM('DRIVER_APP','HARDWARE_GPS','MANUAL'), defaultValue: 'DRIVER_APP' }) source: string;
  @Column({ type: DataType.DATE, allowNull: false }) recordedAt: Date;
  @CreatedAt createdAt: Date;
}

@Table({ tableName: 'geofences' })
export class Geofence extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 }) id: string;
  @Column({ allowNull: false }) name: string;
  @Column({ type: DataType.ENUM('circle','polygon'), allowNull: false }) type: string;
  @Column({ type: DataType.ENUM('pickup','delivery','restricted','checkpoint'), defaultValue: 'checkpoint' }) zoneType: string;
  @Column({ type: DataType.FLOAT }) centerLat: number;
  @Column({ type: DataType.FLOAT }) centerLng: number;
  @Column({ type: DataType.FLOAT }) radiusMeters: number;
  @Column({ type: DataType.JSON }) polygonPoints: number[][];
  @Column({ defaultValue: true }) active: boolean;
  @Column({ type: DataType.JSON, defaultValue: [] }) activeVehicles: string[];
}
