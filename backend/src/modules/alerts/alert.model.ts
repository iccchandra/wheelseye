import { Column, Model, Table, DataType, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

export enum AlertType {
  ROUTE_DEVIATION  = 'ROUTE_DEVIATION',
  GEOFENCE_ENTRY   = 'GEOFENCE_ENTRY',
  GEOFENCE_EXIT    = 'GEOFENCE_EXIT',
  OVERSPEED        = 'OVERSPEED',
  IDLE             = 'IDLE',
  NIGHT_DRIVING    = 'NIGHT_DRIVING',
  DOCUMENT_EXPIRY  = 'DOCUMENT_EXPIRY',
  DELIVERY_DELAY   = 'DELIVERY_DELAY',
  POD_UPLOADED     = 'POD_UPLOADED',
  TRIP_STARTED     = 'TRIP_STARTED',
  TRIP_COMPLETED   = 'TRIP_COMPLETED',
}

export enum AlertSeverity { INFO = 'INFO', WARNING = 'WARNING', CRITICAL = 'CRITICAL' }

@Table({ tableName: 'alerts', updatedAt: false })
export class Alert extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 }) id: string;

  @ForeignKey(() => Shipment)
  @Column({ type: DataType.UUID }) shipmentId: string;

  @Column vehicleId: string;
  @Column({ type: DataType.ENUM(...Object.values(AlertType)) }) type: AlertType;
  @Column({ type: DataType.ENUM(...Object.values(AlertSeverity)), defaultValue: AlertSeverity.WARNING }) severity: AlertSeverity;
  @Column({ type: DataType.TEXT }) message: string;
  @Column({ type: DataType.FLOAT }) lat: number;
  @Column({ type: DataType.FLOAT }) lng: number;
  @Column({ defaultValue: false }) acknowledged: boolean;
  @Column({ type: DataType.DATE }) acknowledgedAt: Date;
  @Column acknowledgedBy: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<string, any>;

  @CreatedAt createdAt: Date;
}
