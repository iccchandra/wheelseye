import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Driver, DriverStatus } from './driver.model';

@Injectable()
export class DriversService {
  constructor(@InjectModel(Driver) private model: typeof Driver) {}

  findAll(params: any = {}) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) where[Op.or] = [
      { name: { [Op.like]: `%${params.search}%` } },
      { phone: { [Op.like]: `%${params.search}%` } },
      { licenceNumber: { [Op.like]: `%${params.search}%` } },
    ];
    return this.model.findAll({ where, order: [['name', 'ASC']] });
  }

  async findOne(id: string) {
    const d = await this.model.findByPk(id);
    if (!d) throw new NotFoundException(`Driver ${id} not found`);
    return d;
  }

  create(data: any) { return this.model.create(data); }

  async update(id: string, data: any) {
    const d = await this.findOne(id);
    return d.update(data);
  }

  getAvailable() {
    return this.model.findAll({ where: { status: DriverStatus.ACTIVE } });
  }

  async incrementTripCount(driverId: string, km: number) {
    await this.model.increment(
      { totalTrips: 1, totalKm: km },
      { where: { id: driverId } }
    );
    await this.model.update({ lastTripAt: new Date() }, { where: { id: driverId } });
  }
}
