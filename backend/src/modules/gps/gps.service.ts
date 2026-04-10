import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { getDistance, isPointInPolygon } from 'geolib';
import { GpsEvent, Geofence } from './gps.models';
import { Shipment } from '../shipments/shipment.model';
import { AlertsService } from '../alerts/alerts.service';
import { GeocodingService } from '../../common/geocoding.service';
import { CreateGpsEventDto } from './dto/create-gps-event.dto';
import { AlertType } from '../alerts/alert.model';

@Injectable()
export class GpsService {
  constructor(
    @InjectModel(GpsEvent) private gpsEventModel: typeof GpsEvent,
    @InjectModel(Geofence) private geofenceModel: typeof Geofence,
    @InjectModel(Shipment) private shipmentModel: typeof Shipment,
    private alertsService: AlertsService,
    private geocodingService: GeocodingService,
  ) {}

  async recordEvent(dto: CreateGpsEventDto): Promise<GpsEvent> {
    return this.gpsEventModel.create({
      ...dto,
      recordedAt: new Date(),
    } as any);
  }

  async getLatestPosition(vehicleId: string) {
    return this.gpsEventModel.findOne({
      where: { vehicleId },
      order: [['recordedAt', 'DESC']],
    });
  }

  async getRouteHistory(shipmentId: string, from?: Date, to?: Date) {
    const where: any = { shipmentId };
    if (from) where.recordedAt = { [Op.gte]: from };
    if (to) where.recordedAt = { ...where.recordedAt, [Op.lte]: to };

    return this.gpsEventModel.findAll({
      where,
      order: [['recordedAt', 'ASC']],
      attributes: ['lat', 'lng', 'speed', 'heading', 'recordedAt'],
    });
  }

  async checkAlerts(dto: CreateGpsEventDto): Promise<void> {
    await Promise.all([
      this.checkGeofence(dto),
      this.checkRouteDeviation(dto),
      this.checkOverspeed(dto),
      this.checkIdleAlert(dto),
    ]);
  }

  private async checkGeofence(dto: CreateGpsEventDto): Promise<void> {
    const geofences = await this.geofenceModel.findAll({ where: { active: true } });

    for (const zone of geofences) {
      const point = { latitude: dto.lat, longitude: dto.lng };
      let isInside = false;

      if (zone.type === 'circle') {
        const dist = getDistance(point, { latitude: zone.centerLat, longitude: zone.centerLng });
        isInside = dist <= zone.radiusMeters;
      } else if (zone.type === 'polygon') {
        isInside = isPointInPolygon(point, zone.polygonPoints.map(p => ({ latitude: p[0], longitude: p[1] })));
      }

      const wasInside = zone.activeVehicles?.includes(dto.vehicleId);

      if (isInside && !wasInside) {
        await zone.update({ activeVehicles: [...(zone.activeVehicles || []), dto.vehicleId] });
        await this.alertsService.createAlert({
          shipmentId: dto.shipmentId, vehicleId: dto.vehicleId,
          type: AlertType.GEOFENCE_ENTRY,
          message: `Vehicle entered geofence zone: ${zone.name}`,
          lat: dto.lat, lng: dto.lng,
        });
      } else if (!isInside && wasInside) {
        await zone.update({ activeVehicles: (zone.activeVehicles || []).filter(v => v !== dto.vehicleId) });
        await this.alertsService.createAlert({
          shipmentId: dto.shipmentId, vehicleId: dto.vehicleId,
          type: AlertType.GEOFENCE_EXIT,
          message: `Vehicle exited geofence zone: ${zone.name}`,
          lat: dto.lat, lng: dto.lng,
        });
      }
    }
  }

  private async checkRouteDeviation(dto: CreateGpsEventDto): Promise<void> {
    const shipment = await this.shipmentModel.findByPk(dto.shipmentId);
    if (!shipment || !shipment.waypoints?.length) return;

    const thresholdKm = +(process.env.ROUTE_DEVIATION_THRESHOLD_KM || 3);
    const point = { latitude: dto.lat, longitude: dto.lng };
    const nearestWpDist = Math.min(
      ...shipment.waypoints.map(wp =>
        getDistance(point, { latitude: wp.lat, longitude: wp.lng }) / 1000
      )
    );

    if (nearestWpDist > thresholdKm) {
      await this.alertsService.createAlert({
        shipmentId: dto.shipmentId, vehicleId: dto.vehicleId,
        type: AlertType.ROUTE_DEVIATION,
        message: `Route deviation: ${nearestWpDist.toFixed(1)} km off planned route`,
        lat: dto.lat, lng: dto.lng,
        metadata: { deviationKm: nearestWpDist },
      });
    }
  }

  private async checkOverspeed(dto: CreateGpsEventDto): Promise<void> {
    const limit = +(process.env.OVERSPEED_LIMIT_KMPH || 90);
    if (dto.speed && dto.speed > limit) {
      await this.alertsService.createAlert({
        shipmentId: dto.shipmentId, vehicleId: dto.vehicleId,
        type: AlertType.OVERSPEED,
        message: `Over-speed alert: ${dto.speed} km/h (limit: ${limit} km/h)`,
        lat: dto.lat, lng: dto.lng,
        metadata: { speed: dto.speed, limit },
      });
    }
  }

  private async checkIdleAlert(dto: CreateGpsEventDto): Promise<void> {
    if (dto.speed && dto.speed > 2) return;
    const idleMinutes = +(process.env.IDLE_ALERT_MINUTES || 45);
    const since = new Date(Date.now() - idleMinutes * 60 * 1000);

    const recentMoving = await this.gpsEventModel.findOne({
      where: { vehicleId: dto.vehicleId, recordedAt: { [Op.gte]: since } },
      order: [['recordedAt', 'DESC']],
    });

    if (!recentMoving) {
      await this.alertsService.createAlert({
        shipmentId: dto.shipmentId, vehicleId: dto.vehicleId,
        type: AlertType.IDLE,
        message: `Vehicle idle for more than ${idleMinutes} minutes`,
        lat: dto.lat, lng: dto.lng,
      });
    }
  }

  async createGeofence(data: Partial<Geofence>): Promise<Geofence> {
    return this.geofenceModel.create(data as any);
  }

  async getGeofences(): Promise<Geofence[]> {
    return this.geofenceModel.findAll({ where: { active: true } });
  }

  async deleteGeofence(id: string): Promise<void> {
    await this.geofenceModel.destroy({ where: { id } });
  }

  async getStopsAndRuns(vehicleId: string, date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const dayStart = new Date(targetDate + 'T00:00:00');
    const dayEnd = new Date(targetDate + 'T23:59:59');

    const points = await this.gpsEventModel.findAll({
      where: { vehicleId, recordedAt: { [Op.gte]: dayStart, [Op.lte]: dayEnd } },
      order: [['recordedAt', 'ASC']],
      attributes: ['lat', 'lng', 'speed', 'recordedAt'],
    });

    if (points.length === 0) return { date: targetDate, segments: [], summary: { totalStopped: 0, totalRunning: 0, stopCount: 0, totalPoints: 0, maxSpeed: 0, avgSpeed: 0, runningPercent: 0 } };

    const STOP_THRESHOLD = 2;
    const segments: any[] = [];
    let segStart = 0;
    let isStopped = (points[0].speed || 0) <= STOP_THRESHOLD;

    for (let i = 1; i <= points.length; i++) {
      const currentStopped = i < points.length ? (points[i].speed || 0) <= STOP_THRESHOLD : !isStopped;

      if (currentStopped !== isStopped || i === points.length) {
        const startPt = points[segStart];
        const endPt = points[Math.min(i - 1, points.length - 1)];
        const startMs = new Date(startPt.recordedAt).getTime();
        const endMs = new Date(endPt.recordedAt).getTime();
        const durationMin = Math.round((endMs - startMs) / 60000);
        const segPoints = points.slice(segStart, i);
        const speeds = segPoints.map(p => p.speed || 0);
        const avgSpeed = speeds.reduce((s, v) => s + v, 0) / speeds.length;
        const maxSpeed = Math.max(...speeds);

        // Calculate distance covered in this segment
        let distanceKm = 0;
        for (let j = 1; j < segPoints.length; j++) {
          distanceKm += getDistance(
            { latitude: segPoints[j - 1].lat, longitude: segPoints[j - 1].lng },
            { latitude: segPoints[j].lat, longitude: segPoints[j].lng },
          ) / 1000;
        }

        if (durationMin >= 1) {
          segments.push({
            index: segments.length,
            type: isStopped ? 'STOPPED' : 'RUNNING',
            startTime: startPt.recordedAt,
            endTime: endPt.recordedAt,
            durationMinutes: durationMin,
            durationFormatted: this.formatDuration(durationMin),
            lat: startPt.lat,
            lng: startPt.lng,
            endLat: endPt.lat,
            endLng: endPt.lng,
            avgSpeed: +avgSpeed.toFixed(1),
            maxSpeed: +maxSpeed.toFixed(1),
            distanceKm: +distanceKm.toFixed(2),
            pointCount: segPoints.length,
            address: null, // filled below for stops
          });
        }
        segStart = i;
        isStopped = currentStopped;
      }
    }

    // Reverse geocode stop locations (only stops, limit to 10)
    const stopSegs = segments.filter(s => s.type === 'STOPPED').slice(0, 10);
    await Promise.all(stopSegs.map(async (seg) => {
      seg.address = await this.geocodingService.reverseGeocode(seg.lat, seg.lng);
    }));

    const totalStopped = segments.filter(s => s.type === 'STOPPED').reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalRunning = segments.filter(s => s.type === 'RUNNING').reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalDistance = segments.reduce((s, seg) => s + seg.distanceKm, 0);
    const allSpeeds = points.map(p => p.speed || 0);
    const longestStop = segments.filter(s => s.type === 'STOPPED').reduce((max, s) => s.durationMinutes > max ? s.durationMinutes : max, 0);

    return {
      date: targetDate,
      segments,
      summary: {
        totalStopped,
        totalRunning,
        totalStoppedFormatted: this.formatDuration(totalStopped),
        totalRunningFormatted: this.formatDuration(totalRunning),
        stopCount: segments.filter(s => s.type === 'STOPPED').length,
        runCount: segments.filter(s => s.type === 'RUNNING').length,
        totalPoints: points.length,
        totalDistanceKm: +totalDistance.toFixed(2),
        maxSpeed: +Math.max(...allSpeeds).toFixed(1),
        avgSpeed: +(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length).toFixed(1),
        longestStopMinutes: longestStop,
        longestStopFormatted: this.formatDuration(longestStop),
        runningPercent: totalStopped + totalRunning > 0 ? +((totalRunning / (totalStopped + totalRunning)) * 100).toFixed(1) : 0,
        firstActivity: points[0].recordedAt,
        lastActivity: points[points.length - 1].recordedAt,
      },
    };
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
