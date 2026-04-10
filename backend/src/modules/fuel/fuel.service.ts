import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { FuelLog } from './fuel.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { CreateFuelDto } from './dto/create-fuel.dto';

@Injectable()
export class FuelService {
  constructor(@InjectModel(FuelLog) private model: typeof FuelLog) {}

  async create(dto: CreateFuelDto): Promise<FuelLog> {
    return this.model.create(dto as any);
  }

  async findAll(params: { vehicleId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.from || params.to) {
      where.fillDate = {};
      if (params.from) where.fillDate[Op.gte] = params.from;
      if (params.to) where.fillDate[Op.lte] = params.to;
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [
        { model: Vehicle, attributes: ['id', 'regNumber'] },
        { model: Driver, attributes: ['id', 'name'] },
      ],
      offset: (page - 1) * limit,
      limit,
      order: [['fillDate', 'DESC']],
    });
    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<FuelLog> {
    const log = await this.model.findByPk(id, { include: [Vehicle, Driver] });
    if (!log) throw new NotFoundException(`Fuel log ${id} not found`);
    return log;
  }

  async update(id: string, data: Partial<CreateFuelDto>): Promise<FuelLog> {
    const log = await this.findOne(id);
    return log.update(data);
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    await log.destroy();
  }

  async getReport(vehicleId: string, from: string, to: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.fillDate = {};
      if (from) where.fillDate[Op.gte] = from;
      if (to) where.fillDate[Op.lte] = to;
    }
    const logs = await this.model.findAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }, { model: Driver, attributes: ['id', 'name'] }],
      order: [['fillDate', 'DESC']],
    });
    const totalQuantity = logs.reduce((s, l) => s + (l.quantity || 0), 0);
    const totalCost = logs.reduce((s, l) => s + (l.totalAmount || 0), 0);
    return { logs, totalQuantity, totalCost, avgPricePerUnit: totalQuantity > 0 ? +(totalCost / totalQuantity).toFixed(2) : 0 };
  }
}
