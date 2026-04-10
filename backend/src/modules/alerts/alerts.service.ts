import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Alert, AlertType, AlertSeverity } from './alert.model';
import { Shipment } from '../shipments/shipment.model';

@Injectable()
export class AlertsService {
  constructor(@InjectModel(Alert) private model: typeof Alert) {}

  async createAlert(data: {
    shipmentId: string; vehicleId: string; type: AlertType;
    message: string; lat?: number; lng?: number; metadata?: any;
  }): Promise<Alert> {
    const severity = this.getSeverity(data.type);
    return this.model.create({ ...data, severity } as any);
  }

  async onShipmentStatusChange(shipment: Shipment) {
    const typeMap: Record<string, AlertType> = {
      IN_TRANSIT: AlertType.TRIP_STARTED,
      DELIVERED:  AlertType.TRIP_COMPLETED,
    };
    const type = typeMap[shipment.status];
    if (!type) return;
    await this.createAlert({
      shipmentId: shipment.id,
      vehicleId: shipment.vehicleId,
      type,
      message: `Shipment ${shipment.trackingNumber} — ${shipment.status.replace('_', ' ').toLowerCase()}`,
    });
  }

  findAll(params: any = {}) {
    const where: any = {};
    if (params.shipmentId) where.shipmentId = params.shipmentId;
    if (params.acknowledged !== undefined && params.acknowledged !== '')
      where.acknowledged = params.acknowledged === true || params.acknowledged === 'true';
    if (params.type) where.type = params.type;
    return this.model.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
  }

  async acknowledge(id: string, by = 'system') {
    await this.model.update(
      { acknowledged: true, acknowledgedAt: new Date(), acknowledgedBy: by },
      { where: { id } }
    );
    return this.model.findByPk(id);
  }

  getUnread() {
    return this.model.findAll({ where: { acknowledged: false }, order: [['createdAt', 'DESC']] });
  }

  private getSeverity(type: AlertType): AlertSeverity {
    const critical = [AlertType.ROUTE_DEVIATION, AlertType.OVERSPEED, AlertType.DELIVERY_DELAY];
    const info = [AlertType.TRIP_STARTED, AlertType.TRIP_COMPLETED, AlertType.POD_UPLOADED, AlertType.GEOFENCE_ENTRY, AlertType.GEOFENCE_EXIT];
    if (critical.includes(type)) return AlertSeverity.CRITICAL;
    if (info.includes(type)) return AlertSeverity.INFO;
    return AlertSeverity.WARNING;
  }
}
