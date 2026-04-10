import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { IncomeExpense, EntryType } from './income-expense.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { CreateIncomeExpenseDto } from './dto/create-income-expense.dto';

@Injectable()
export class IncomeExpenseService {
  constructor(@InjectModel(IncomeExpense) private model: typeof IncomeExpense) {}

  async create(dto: CreateIncomeExpenseDto): Promise<IncomeExpense> {
    return this.model.create(dto as any);
  }

  async findAll(params: { vehicleId?: string; type?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.type) where.type = params.type;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date[Op.gte] = params.from;
      if (params.to) where.date[Op.lte] = params.to;
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      offset: (page - 1) * limit,
      limit,
      order: [['date', 'DESC']],
    });
    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<IncomeExpense> {
    const entry = await this.model.findByPk(id, { include: [Vehicle] });
    if (!entry) throw new NotFoundException(`Entry ${id} not found`);
    return entry;
  }

  async update(id: string, data: Partial<CreateIncomeExpenseDto>): Promise<IncomeExpense> {
    const entry = await this.findOne(id);
    return entry.update(data);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await entry.destroy();
  }

  async getReport(vehicleId: string, from: string, to: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const entries = await this.model.findAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      order: [['date', 'DESC']],
    });

    const totalIncome = entries.filter(e => e.type === EntryType.INCOME).reduce((s, e) => s + e.amount, 0);
    const totalExpense = entries.filter(e => e.type === EntryType.EXPENSE).reduce((s, e) => s + e.amount, 0);

    return { entries, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  }
}
