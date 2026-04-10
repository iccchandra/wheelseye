import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VehicleGroup } from './vehicle-group.model';
import { Vehicle } from '../vehicles/vehicle.model';

@Injectable()
export class VehicleGroupsService {
  constructor(@InjectModel(VehicleGroup) private model: typeof VehicleGroup) {}

  async create(data: { name: string; description?: string }): Promise<VehicleGroup> {
    return this.model.create(data as any);
  }

  async findAll(): Promise<VehicleGroup[]> {
    return this.model.findAll({ include: [{ model: Vehicle, attributes: ['id'] }], order: [['name', 'ASC']] });
  }

  async findOne(id: string): Promise<VehicleGroup> {
    const g = await this.model.findByPk(id, { include: [Vehicle] });
    if (!g) throw new NotFoundException(`Group ${id} not found`);
    return g;
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<VehicleGroup> {
    const g = await this.findOne(id);
    return g.update(data);
  }

  async remove(id: string): Promise<void> {
    const g = await this.model.findByPk(id, { include: [{ model: Vehicle, attributes: ['id'] }] });
    if (!g) throw new NotFoundException(`Group ${id} not found`);
    if ((g as any).vehicles?.length > 0) throw new ConflictException('Cannot delete group with assigned vehicles');
    await g.destroy();
  }
}
