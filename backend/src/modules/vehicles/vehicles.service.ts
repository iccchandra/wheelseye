import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Vehicle, VehicleStatus } from './vehicle.model';

@Injectable()
export class VehiclesService {
  constructor(@InjectModel(Vehicle) private model: typeof Vehicle) {}

  findAll(params: any = {}) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) where[Op.or] = [
      { regNumber: { [Op.like]: `%${params.search}%` } },
      { ownerName: { [Op.like]: `%${params.search}%` } },
    ];
    return this.model.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async findOne(id: string) {
    const v = await this.model.findByPk(id);
    if (!v) throw new NotFoundException(`Vehicle ${id} not found`);
    return v;
  }

  create(data: any) { return this.model.create(data); }

  async update(id: string, data: any) {
    const v = await this.findOne(id);
    return v.update(data);
  }

  async updateLocation(vehicleId: string, lat: number, lng: number, speed: number) {
    await this.model.update(
      { currentLat: lat, currentLng: lng, lastSpeed: speed, lastPingAt: new Date(), status: VehicleStatus.ON_TRIP },
      { where: { id: vehicleId } }
    );
  }

  getAvailable() {
    return this.model.findAll({ where: { status: VehicleStatus.AVAILABLE } });
  }

  async getExpiringDocuments(days = 30) {
    const cutoff = new Date(Date.now() + days * 86400000);
    return this.model.findAll({
      where: {
        [Op.or]: [
          { rcExpiry: { [Op.lte]: cutoff } },
          { insuranceExpiry: { [Op.lte]: cutoff } },
          { pollutionExpiry: { [Op.lte]: cutoff } },
          { fitnessExpiry: { [Op.lte]: cutoff } },
        ],
      },
    });
  }
}
