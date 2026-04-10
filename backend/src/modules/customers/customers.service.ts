import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Customer } from './customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer) private model: typeof Customer) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    if (dto.email) {
      const existing = await this.model.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
    }
    return this.model.create(dto as any);
  }

  async findAll(params: { search?: string; isActive?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    if (params.isActive !== undefined) where.isActive = params.isActive === 'true';
    if (params.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.search}%` } },
        { email: { [Op.like]: `%${params.search}%` } },
        { phone: { [Op.like]: `%${params.search}%` } },
      ];
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      order: [['name', 'ASC']],
    });
    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<Customer> {
    const c = await this.model.findByPk(id);
    if (!c) throw new NotFoundException(`Customer ${id} not found`);
    return c;
  }

  async update(id: string, data: Partial<CreateCustomerDto>): Promise<Customer> {
    const c = await this.findOne(id);
    if (data.email && data.email !== c.email) {
      const dup = await this.model.findOne({ where: { email: data.email } });
      if (dup && dup.id !== id) throw new ConflictException('Email already in use');
    }
    return c.update(data);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findOne(id);
    await c.destroy();
  }
}
