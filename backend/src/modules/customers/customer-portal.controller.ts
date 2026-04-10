import { Controller, Get, Post, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Customer } from './customer.model';
import { Shipment } from '../shipments/shipment.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Op } from 'sequelize';

@ApiTags('Customer Portal')
@Controller('portal')
export class CustomerPortalController {
  constructor(
    @InjectModel(Customer) private customerModel: typeof Customer,
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    @InjectModel(Vehicle) private vehicleModel: typeof Vehicle,
    private jwtService: JwtService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Customer self-registration' })
  async signup(@Body() body: { name: string; phone: string; email: string; password: string; address?: string }) {
    const existing = await this.customerModel.findOne({ where: { email: body.email } });
    if (existing) throw new UnauthorizedException('Email already registered');
    const hashed = await bcrypt.hash(body.password, 10);
    const customer = await this.customerModel.create({ ...body, password: hashed } as any);
    const token = this.jwtService.sign({ sub: customer.id, type: 'customer' });
    return { access_token: token, customer: { id: customer.id, name: customer.name, email: customer.email } };
  }

  @Post('login')
  @ApiOperation({ summary: 'Customer login' })
  async login(@Body() body: { email: string; password: string }) {
    const customer = await this.customerModel.findOne({ where: { email: body.email, isActive: true } });
    if (!customer || !customer.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(body.password, customer.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({ sub: customer.id, type: 'customer' });
    return { access_token: token, customer: { id: customer.id, name: customer.name, email: customer.email } };
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Browse available vehicles' })
  async getAvailableVehicles() {
    return this.vehicleModel.findAll({
      where: { status: 'AVAILABLE' },
      attributes: ['id', 'regNumber', 'type', 'capacityMT', 'make', 'model'],
    });
  }

  @Post('book')
  @ApiOperation({ summary: 'Create a booking (requires customer token)' })
  async createBooking(@Body() body: any, @Req() req: any) {
    const customer = await this.verifyCustomer(req);

    const trackingNumber = `TRK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const shipment = await this.shipmentModel.create({
      ...body,
      customerId: customer.id,
      consigneeName: customer.name,
      consigneePhone: customer.phone,
      trackingNumber,
      status: 'INQUIRY',
    } as any);

    return { shipment, trackingNumber };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'View my bookings (requires customer token)' })
  async getMyBookings(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
    const customer = await this.verifyCustomer(req);

    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const { rows, count } = await this.shipmentModel.findAndCountAll({
      where: { customerId: customer.id },
      include: [Vehicle],
      offset: (p - 1) * l,
      limit: l,
      order: [['createdAt', 'DESC']],
    });
    return { data: rows, total: count, page: p, totalPages: Math.ceil(count / l) };
  }

  private async verifyCustomer(req: any): Promise<Customer> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Login required');
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.type !== 'customer') throw new UnauthorizedException('Customer login required');
    const customer = await this.customerModel.findByPk(payload.sub);
    if (!customer) throw new UnauthorizedException('Customer not found');
    return customer;
  }
}
