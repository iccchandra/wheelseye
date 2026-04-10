import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Reminder } from './reminder.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(@InjectModel(Reminder) private model: typeof Reminder) {}

  async create(dto: CreateReminderDto): Promise<Reminder> {
    return this.model.create(dto as any);
  }

  async findAll(params: { vehicleId?: string; unreadOnly?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.unreadOnly === 'true') where.isRead = false;

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      offset: (page - 1) * limit,
      limit,
      order: [['dueDate', 'ASC']],
    });
    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async getToday(): Promise<Reminder[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.model.findAll({
      where: { dueDate: { [Op.gte]: today, [Op.lt]: tomorrow }, isRead: false },
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      order: [['dueDate', 'ASC']],
    });
  }

  async getUpcoming(days = 7): Promise<Reminder[]> {
    const now = new Date();
    const future = new Date(Date.now() + days * 86400000);
    return this.model.findAll({
      where: { dueDate: { [Op.gte]: now, [Op.lte]: future }, isRead: false },
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      order: [['dueDate', 'ASC']],
    });
  }

  async markAsRead(id: string): Promise<Reminder> {
    const reminder = await this.model.findByPk(id);
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    return reminder.update({ isRead: true, readAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    const reminder = await this.model.findByPk(id);
    if (!reminder) throw new NotFoundException(`Reminder ${id} not found`);
    await reminder.destroy();
  }
}
