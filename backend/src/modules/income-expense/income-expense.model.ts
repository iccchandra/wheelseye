import {
  Column, Model, Table, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Vehicle } from '../vehicles/vehicle.model';

export enum EntryType { INCOME = 'INCOME', EXPENSE = 'EXPENSE' }

@Table({ tableName: 'income_expenses', paranoid: true })
export class IncomeExpense extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID }) vehicleId: string;

  @Column({ type: DataType.ENUM(...Object.values(EntryType)), allowNull: false }) type: EntryType;
  @Column({ type: DataType.FLOAT, allowNull: false }) amount: number;
  @Column({ type: DataType.DATE, allowNull: false }) date: Date;
  @Column({ type: DataType.STRING, allowNull: false }) description: string;
  @Column({ type: DataType.STRING }) category: string;
  @Column({ type: DataType.STRING }) referenceId: string;
  @Column({ type: DataType.STRING }) referenceType: string;

  @BelongsTo(() => Vehicle) vehicle: Vehicle;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
