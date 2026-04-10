import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as QRCode from 'qrcode';
import { DriverAttendance, AttendanceType } from './attendance.model';
import { Driver } from '../drivers/driver.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { GeocodingService } from '../../common/geocoding.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(DriverAttendance) private model: typeof DriverAttendance,
    @InjectModel(Vehicle) private vehicleModel: typeof Vehicle,
    @InjectModel(Driver) private driverModel: typeof Driver,
    private geocoding: GeocodingService,
  ) {}

  // --- QR Code ---
  async generateVehicleQR(vehicleId: string): Promise<string> {
    const vehicle = await this.vehicleModel.findByPk(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const payload = JSON.stringify({
      id: vehicle.id,
      regNumber: vehicle.regNumber,
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
    });
    return QRCode.toDataURL(payload, { width: 400, margin: 2, color: { dark: '#0f172a' } });
  }

  // --- Scan QR → get vehicle details ---
  async getVehicleFromQR(vehicleId: string) {
    const vehicle = await this.vehicleModel.findByPk(vehicleId, {
      attributes: ['id', 'regNumber', 'type', 'make', 'model', 'capacityMT', 'status', 'ownerName', 'gpsEnabled'],
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Get today's attendance for this vehicle
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await this.model.findAll({
      where: { vehicleId, createdAt: { [Op.gte]: today } },
      include: [{ model: Driver, attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    return { vehicle, todayAttendance };
  }

  // --- Mark attendance ---
  async markAttendance(dto: MarkAttendanceDto): Promise<DriverAttendance> {
    const [driver, vehicle] = await Promise.all([
      this.driverModel.findByPk(dto.driverId),
      this.vehicleModel.findByPk(dto.vehicleId),
    ]);
    if (!driver) throw new NotFoundException('Driver not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    // Prevent duplicate check-in without check-out
    if (dto.type === AttendanceType.CHECK_IN) {
      const lastRecord = await this.model.findOne({
        where: { driverId: dto.driverId, createdAt: { [Op.gte]: this.todayStart() } },
        order: [['createdAt', 'DESC']],
      });
      if (lastRecord && lastRecord.type === AttendanceType.CHECK_IN) {
        throw new BadRequestException('Already checked in. Please check out first.');
      }
    }

    if (dto.type === AttendanceType.CHECK_OUT) {
      const lastRecord = await this.model.findOne({
        where: { driverId: dto.driverId, createdAt: { [Op.gte]: this.todayStart() } },
        order: [['createdAt', 'DESC']],
      });
      if (!lastRecord || lastRecord.type !== AttendanceType.CHECK_IN) {
        throw new BadRequestException('Not checked in yet. Please check in first.');
      }
    }

    // Reverse geocode the location
    const address = await this.geocoding.reverseGeocode(dto.lat, dto.lng);

    return this.model.create({
      ...dto,
      address,
      vehicleSnapshot: {
        regNumber: vehicle.regNumber,
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
      },
    } as any);
  }

  // --- Today's attendance summary ---
  async getTodaySummary() {
    const today = this.todayStart();
    const records = await this.model.findAll({
      where: { createdAt: { [Op.gte]: today } },
      include: [
        { model: Driver, attributes: ['id', 'name', 'phone', 'status'] },
        { model: Vehicle, attributes: ['id', 'regNumber', 'type'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalDrivers = await this.driverModel.count({ where: { status: { [Op.ne]: 'INACTIVE' } } });
    const checkedInDriverIds = new Set<string>();
    const checkedOutDriverIds = new Set<string>();

    for (const r of records) {
      if (r.type === AttendanceType.CHECK_IN && !checkedOutDriverIds.has(r.driverId)) {
        checkedInDriverIds.add(r.driverId);
      }
      if (r.type === AttendanceType.CHECK_OUT) {
        checkedOutDriverIds.add(r.driverId);
        checkedInDriverIds.delete(r.driverId);
      }
    }

    return {
      totalDrivers,
      presentToday: checkedInDriverIds.size + checkedOutDriverIds.size,
      currentlyOnDuty: checkedInDriverIds.size,
      checkedOut: checkedOutDriverIds.size,
      absent: totalDrivers - (checkedInDriverIds.size + checkedOutDriverIds.size),
      records,
    };
  }

  // --- Driver's attendance history ---
  async getDriverHistory(driverId: string, from?: string, to?: string) {
    const where: any = { driverId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to + 'T23:59:59');
    }
    const records = await this.model.findAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }],
      order: [['createdAt', 'DESC']],
    });

    // Calculate total hours worked
    let totalMinutes = 0;
    const pairs: Array<{ checkIn: any; checkOut: any; minutes: number }> = [];
    const checkIns: any[] = [];

    for (const r of [...records].reverse()) {
      if (r.type === AttendanceType.CHECK_IN) {
        checkIns.push(r);
      } else if (r.type === AttendanceType.CHECK_OUT && checkIns.length) {
        const ci = checkIns.pop();
        const mins = Math.round((new Date(r.createdAt).getTime() - new Date(ci.createdAt).getTime()) / 60000);
        totalMinutes += mins;
        pairs.push({ checkIn: ci, checkOut: r, minutes: mins });
      }
    }

    return {
      records,
      pairs,
      totalMinutes,
      totalHoursFormatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      totalDays: new Set(records.map(r => new Date(r.createdAt).toDateString())).size,
    };
  }

  // --- All attendance with filters ---
  async findAll(params: { driverId?: string; vehicleId?: string; date?: string; page?: number; limit?: number }) {
    const where: any = {};
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;

    if (params.driverId) where.driverId = params.driverId;
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.date) {
      const d = new Date(params.date); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.createdAt = { [Op.gte]: d, [Op.lt]: next };
    }

    const { rows, count } = await this.model.findAndCountAll({
      where,
      include: [
        { model: Driver, attributes: ['id', 'name', 'phone'] },
        { model: Vehicle, attributes: ['id', 'regNumber', 'type'] },
      ],
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  private todayStart(): Date {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }
}
