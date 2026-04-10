import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../auth/user.model';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private model: typeof User) {}

  async findAll(params: { search?: string; role?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    if (params.role) where.role = params.role;
    if (params.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.search}%` } },
        { phone: { [Op.like]: `%${params.search}%` } },
        { email: { [Op.like]: `%${params.search}%` } },
      ];
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      attributes: { exclude: ['otpCode', 'otpExpiresAt'] },
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });
    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<User> {
    const u = await this.model.findByPk(id, { attributes: { exclude: ['otpCode', 'otpExpiresAt'] } });
    if (!u) throw new NotFoundException(`User ${id} not found`);
    return u;
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.model.create(dto as any);
  }

  async update(id: string, data: Partial<CreateUserDto>): Promise<User> {
    const u = await this.findOne(id);
    return u.update(data);
  }

  async remove(id: string): Promise<void> {
    const u = await this.findOne(id);
    await u.destroy();
  }
}
