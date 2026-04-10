import { Column, Model, Table, DataType, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Shipment } from '../shipments/shipment.model';

export enum DriverStatus { ACTIVE = 'ACTIVE', ON_TRIP = 'ON_TRIP', INACTIVE = 'INACTIVE', BLACKLISTED = 'BLACKLISTED' }

@Table({ tableName: 'drivers', paranoid: true })
export class Driver extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column name: string;
  @Column({ unique: true }) phone: string;
  @Column({ type: DataType.ENUM(...Object.values(DriverStatus)), defaultValue: DriverStatus.ACTIVE }) status: DriverStatus;

  @Column licenceNumber: string;
  @Column({ type: DataType.DATE }) licenceExpiry: Date;
  @Column licenceType: string;

  @Column aadhaarNumber: string;
  @Column photoUrl: string;
  @Column licenceImageUrl: string;
  @Column aadhaarImageUrl: string;

  @Column({ type: DataType.FLOAT, defaultValue: 5.0 }) safetyScore: number;
  @Column({ defaultValue: 0 }) totalTrips: number;
  @Column({ defaultValue: 0 }) totalKm: number;

  @Column({ type: DataType.DATE }) lastTripAt: Date;
  @Column({ type: DataType.DATE }) dateOfBirth: Date;
  @Column gender: string;
  @Column bloodGroup: string;
  @Column email: string;
  @Column nationality: string;
  @Column education: string;

  @Column address: string;
  @Column addressAsPerLicence: string;
  @Column addressAsPerAadhaar: string;

  @Column emergencyContact: string;
  @Column emergencyContactName: string;
  @Column emergencyContactRelation: string;

  @Column badgeNumber: string;
  @Column licenceRefNumber: string;
  @Column({ type: DataType.DATE }) licenceFirstIssueDate: Date;
  @Column licencingAuthority: string;
  @Column transportLicenceType: string;
  @Column({ type: DataType.DATE }) transportLicenceExpiry: Date;
  @Column nonTransportLicenceType: string;
  @Column({ type: DataType.DATE }) nonTransportLicenceExpiry: Date;

  @Column({ type: DataType.DATE }) dateOfJoining: Date;
  @Column({ type: DataType.FLOAT }) totalExperience: number;
  @Column driverType: string;

  @Column({ type: DataType.TEXT }) blacklistReason: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<string, any>;

  @HasMany(() => Shipment) shipments: Shipment[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
