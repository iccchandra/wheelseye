import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import * as ExcelJS from 'exceljs';
import { Shipment } from '../shipments/shipment.model';
import { Vehicle } from '../vehicles/vehicle.model';
import { Driver } from '../drivers/driver.model';
import { Alert } from '../alerts/alert.model';
import { FuelLog } from '../fuel/fuel.model';
import { IncomeExpense } from '../income-expense/income-expense.model';
import { GeocodingService } from '../../common/geocoding.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    @InjectModel(Vehicle)  private vehicleModel: typeof Vehicle,
    @InjectModel(Driver)   private driverModel: typeof Driver,
    @InjectModel(Alert)    private alertModel: typeof Alert,
    @InjectModel(FuelLog)  private fuelModel: typeof FuelLog,
    @InjectModel(IncomeExpense) private ieModel: typeof IncomeExpense,
    private geocoding: GeocodingService,
  ) {}

  async getOTDR(from: Date, to: Date) {
    const total = await this.shipmentModel.count({
      where: { status: 'DELIVERED', actualDelivery: { [Op.between]: [from, to] } },
    });
    const onTime = await this.shipmentModel.count({
      where: {
        status: 'DELIVERED',
        actualDelivery: { [Op.between]: [from, to] },
        [Op.and]: literal('`Shipment`.`actualDelivery` <= `Shipment`.`estimatedDelivery`'),
      },
    });
    return {
      total,
      onTime,
      delayed: total - onTime,
      otdrPercent: total > 0 ? +((onTime / total) * 100).toFixed(1) : 0,
    };
  }

  async getLanePerformance(from: Date, to: Date) {
    const shipments = await this.shipmentModel.findAll({
      where: { status: 'DELIVERED', actualDelivery: { [Op.between]: [from, to] } },
      attributes: ['origin', 'destination', 'finalAmount', 'actualPickup', 'actualDelivery'],
    });

    const lanes: Record<string, any> = {};
    for (const s of shipments) {
      const key = `${s.origin}→${s.destination}`;
      if (!lanes[key]) lanes[key] = { lane: key, count: 0, totalAmount: 0, totalHours: 0 };
      lanes[key].count++;
      lanes[key].totalAmount += s.finalAmount || 0;
      if (s.actualPickup && s.actualDelivery) {
        lanes[key].totalHours += (new Date(s.actualDelivery).getTime() - new Date(s.actualPickup).getTime()) / 3600000;
      }
    }

    return Object.values(lanes).map((l: any) => ({
      ...l,
      avgAmount: +(l.totalAmount / l.count).toFixed(0),
      avgTransitHours: +(l.totalHours / l.count).toFixed(1),
    })).sort((a: any, b: any) => b.count - a.count);
  }

  async getCarrierScorecard(from: Date, to: Date) {
    const vehicles = await this.vehicleModel.findAll({ include: [{ model: Shipment, where: { status: 'DELIVERED', actualDelivery: { [Op.between]: [from, to] } }, required: false }] });

    return vehicles
      .filter((v: any) => v.shipments?.length > 0)
      .map((v: any) => {
        const trips = v.shipments as Shipment[];
        const onTime = trips.filter((s: any) => s.actualDelivery <= s.estimatedDelivery).length;
        return {
          vehicleId: v.id,
          regNumber: v.regNumber,
          trips: trips.length,
          onTime,
          delayed: trips.length - onTime,
          otdr: +((onTime / trips.length) * 100).toFixed(1),
        };
      })
      .sort((a, b) => b.otdr - a.otdr);
  }

  async exportExcel(type: string, from: Date, to: Date): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(type.toUpperCase());

    if (type === 'shipments') {
      const rows = await this.shipmentModel.findAll({
        where: { createdAt: { [Op.between]: [from, to] } },
        include: [Vehicle, Driver],
      });
      ws.columns = [
        { header: 'Tracking #',   key: 'trackingNumber', width: 18 },
        { header: 'Status',       key: 'status',         width: 14 },
        { header: 'Origin',       key: 'origin',         width: 18 },
        { header: 'Destination',  key: 'destination',    width: 18 },
        { header: 'Vehicle',      key: 'vehicle',        width: 16 },
        { header: 'Driver',       key: 'driver',         width: 18 },
        { header: 'Cargo',        key: 'cargo',          width: 20 },
        { header: 'Weight (MT)',  key: 'weight',         width: 12 },
        { header: 'Amount (₹)',   key: 'amount',         width: 14 },
        { header: 'Created',      key: 'created',        width: 18 },
      ];
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F1FB' } };

      rows.forEach((s: any) => ws.addRow({
        trackingNumber: s.trackingNumber,
        status: s.status,
        origin: s.origin,
        destination: s.destination,
        vehicle: s.vehicle?.regNumber || '—',
        driver: s.driver?.name || '—',
        cargo: s.cargoDescription,
        weight: s.weightMT,
        amount: s.finalAmount || s.quotedAmount,
        created: new Date(s.createdAt).toLocaleDateString('en-IN'),
      }));
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async getDashboardSummary() {
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const monthAgo = new Date(Date.now() - 30 * 86400000);

    const [activeShipments, deliveredThisWeek, totalVehicles, activeAlerts] = await Promise.all([
      this.shipmentModel.count({ where: { status: { [Op.in]: ['DISPATCHED', 'IN_TRANSIT', 'DELAYED'] } } }),
      this.shipmentModel.count({ where: { status: 'DELIVERED', actualDelivery: { [Op.gte]: weekAgo } } }),
      this.vehicleModel.count(),
      this.alertModel.count({ where: { acknowledged: false } }),
    ]);

    const [onTrip, available, maintenance] = await Promise.all([
      this.vehicleModel.count({ where: { status: 'ON_TRIP' } }),
      this.vehicleModel.count({ where: { status: 'AVAILABLE' } }),
      this.vehicleModel.count({ where: { status: 'MAINTENANCE' } }),
    ]);

    const otdr = await this.getOTDR(monthAgo, now);

    return {
      activeShipments,
      deliveredThisWeek,
      fleet: { total: totalVehicles, onTrip, available, maintenance },
      unacknowledgedAlerts: activeAlerts,
      otdrLast30Days: otdr.otdrPercent,
    };
  }

  async getFuelReport(from: Date, to: Date, vehicleId?: string) {
    const where: any = { fillDate: { [Op.between]: [from, to] } };
    if (vehicleId) where.vehicleId = vehicleId;
    const logs = await this.fuelModel.findAll({
      where,
      include: [{ model: Vehicle, attributes: ['id', 'regNumber'] }, { model: Driver, attributes: ['id', 'name'] }],
      order: [['fillDate', 'DESC']],
    });
    const totalQty = logs.reduce((s, l) => s + (l.quantity || 0), 0);
    const totalCost = logs.reduce((s, l) => s + (l.totalAmount || 0), 0);
    return { logs, totalQuantity: totalQty, totalCost, avgPricePerUnit: totalQty ? +(totalCost / totalQty).toFixed(2) : 0 };
  }

  async getTripReport(from: Date, to: Date, vehicleId?: string) {
    const where: any = { createdAt: { [Op.between]: [from, to] } };
    if (vehicleId) where.vehicleId = vehicleId;
    const trips = await this.shipmentModel.findAll({
      where, include: [Vehicle, Driver], order: [['createdAt', 'DESC']],
    });
    const total = trips.length;
    const delivered = trips.filter(t => t.status === 'DELIVERED').length;
    const revenue = trips.reduce((s, t) => s + (t.finalAmount || t.quotedAmount || 0), 0);
    return { trips, total, delivered, cancelled: trips.filter(t => t.status === 'CANCELLED').length, revenue };
  }

  async getIncomeExpenseChart(days = 7) {
    const labels: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      const dayEntries = await this.ieModel.findAll({ where: { date: { [Op.gte]: d, [Op.lt]: next } } });
      income.push(dayEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0));
      expense.push(dayEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0));
    }
    return { labels, income, expense };
  }

  async getVehicleLocations() {
    const vehicles = await this.vehicleModel.findAll({
      where: { currentLat: { [Op.ne]: null } },
      attributes: ['id', 'regNumber', 'status', 'currentLat', 'currentLng', 'lastPingAt', 'lastSpeed'],
    });
    const result = await Promise.all(vehicles.map(async v => {
      const address = await this.geocoding.reverseGeocode(v.currentLat, v.currentLng);
      return { ...v.toJSON(), address };
    }));
    return result;
  }

  async getGeofenceEvents(limit = 20) {
    const events = await this.alertModel.findAll({
      where: { type: { [Op.in]: ['GEOFENCE_ENTRY', 'GEOFENCE_EXIT'] } },
      order: [['createdAt', 'DESC']],
      limit,
    });
    return events;
  }
}
