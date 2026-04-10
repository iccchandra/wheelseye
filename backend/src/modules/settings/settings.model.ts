import { Column, Model, Table, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({ tableName: 'app_settings' })
export class AppSetting extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ unique: true, allowNull: false }) key: string;
  @Column({ type: DataType.TEXT }) value: string;
  @Column({ type: DataType.STRING }) group: string;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

@Table({ tableName: 'email_templates' })
export class EmailTemplate extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ unique: true, allowNull: false }) name: string;
  @Column subject: string;
  @Column({ type: DataType.TEXT }) body: string;
  @Column({ type: DataType.JSON, defaultValue: [] }) placeholders: string[];

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}
