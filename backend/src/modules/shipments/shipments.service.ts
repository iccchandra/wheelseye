import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Shipment, ShipmentStatus } from './shipment.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    private alertsService: AlertsService,
  ) {}

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const trackingNumber = `TRK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    return this.shipmentModel.create({ ...dto, trackingNumber, id: uuidv4() } as any);
  }

  async findAll(filters: {
    status?: ShipmentStatus;
    vehicleId?: string;
    driverId?: string;
    from?: Date;
    to?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, vehicleId, driverId, from, to, search } = filters;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim()).filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
    }
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = from;
      if (to) where.createdAt[Op.lte] = to;
    }
    if (search) {
      where[Op.or] = [
        { trackingNumber: { [Op.like]: `%${search}%` } },
        { origin: { [Op.like]: `%${search}%` } },
        { destination: { [Op.like]: `%${search}%` } },
        { consigneeName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await this.shipmentModel.findAndCountAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber', 'type'] }, { model: Driver, attributes: ['id', 'name', 'phone'] }],
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findByTracking(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentModel.findOne({
      where: { trackingNumber },
      include: [Vehicle, Driver],
    });
    if (!shipment) throw new NotFoundException(`Shipment ${trackingNumber} not found`);
    return shipment;
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentModel.findByPk(id, { include: [Vehicle, Driver] });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }

  private static VALID_TRANSITIONS: Record<string, string[]> = {
    INQUIRY:    ['QUOTED', 'CANCELLED'],
    QUOTED:     ['BOOKED', 'CANCELLED'],
    BOOKED:     ['DISPATCHED', 'CANCELLED'],
    DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'DELAYED'],
    DELAYED:    ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    DELIVERED:  [],
    CANCELLED:  [],
  };

  async updateStatus(id: string, status: ShipmentStatus, meta?: Partial<Shipment>): Promise<Shipment> {
    const shipment = await this.findOne(id);
    const allowed = ShipmentsService.VALID_TRANSITIONS[shipment.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${shipment.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`);
    }

    const updates: any = { status, ...meta };

    if (status === ShipmentStatus.IN_TRANSIT && !shipment.actualPickup) {
      updates.actualPickup = new Date();
    }
    if (status === ShipmentStatus.DELIVERED) {
      updates.actualDelivery = new Date();
    }

    await shipment.update(updates);
    await this.alertsService.onShipmentStatusChange(shipment);
    return shipment;
  }

  async assignVehicleDriver(id: string, vehicleId: string, driverId: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    await shipment.update({ vehicleId, driverId, status: ShipmentStatus.DISPATCHED });
    return shipment;
  }

  async uploadPOD(id: string, imageUrl: string, signatureUrl?: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    await shipment.update({
      podImageUrl: imageUrl,
      podSignatureUrl: signatureUrl,
      podCapturedAt: new Date(),
      status: ShipmentStatus.DELIVERED,
    });
    await this.alertsService.onShipmentStatusChange(shipment);
    return shipment;
  }

  async getDashboardStats() {
    const [moving, idle, delayed, delivered, total] = await Promise.all([
      this.shipmentModel.count({ where: { status: ShipmentStatus.IN_TRANSIT } }),
      this.shipmentModel.count({ where: { status: ShipmentStatus.DISPATCHED } }),
      this.shipmentModel.count({ where: { status: ShipmentStatus.DELAYED } }),
      this.shipmentModel.count({ where: { status: ShipmentStatus.DELIVERED } }),
      this.shipmentModel.count(),
    ]);
    return { moving, idle, delayed, delivered, total };
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    await shipment.update(dto);
    return shipment;
  }

  async remove(id: string): Promise<void> {
    const shipment = await this.findOne(id);
    await shipment.destroy();
  }
}
