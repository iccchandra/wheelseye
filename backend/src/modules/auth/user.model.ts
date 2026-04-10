import { Column, Model, Table, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum UserRole { ADMIN = 'ADMIN', OPS = 'OPS', SHIPPER = 'SHIPPER', TRANSPORTER = 'TRANSPORTER' }

@Table({ tableName: 'users', paranoid: true })
export class User extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 }) id: string;
  @Column({ unique: true }) phone: string;
  @Column({ unique: true, allowNull: true }) email: string;
  @Column name: string;
  @Column({ type: DataType.ENUM(...Object.values(UserRole)), defaultValue: UserRole.SHIPPER }) role: UserRole;
  @Column({ defaultValue: true }) isActive: boolean;
  @Column otpCode: string;
  @Column({ type: DataType.DATE }) otpExpiresAt: Date;
  @Column({ type: DataType.DATE }) lastLoginAt: Date;
  @Column companyName: string;
  @Column gstin: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) permissions: Record<string, boolean>;
  @Column({ type: DataType.TEXT }) companyAddress: string;
  @Column({ type: DataType.JSON, defaultValue: {} }) metadata: Record<string, any>;
  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
