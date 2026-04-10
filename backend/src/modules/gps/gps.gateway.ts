import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GpsService } from './gps.service';
import { CreateGpsEventDto } from './dto/create-gps-event.dto';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/gps',
})
export class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private gpsService: GpsService) {}

  handleConnection(client: Socket) {
    console.log(`GPS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`GPS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('driver:location')
  async handleLocationUpdate(
    @MessageBody() dto: CreateGpsEventDto,
    @ConnectedSocket() client: Socket,
  ) {
    const event = await this.gpsService.recordEvent(dto);

    this.server.to(`shipment:${dto.shipmentId}`).emit('location:update', {
      shipmentId: dto.shipmentId,
      vehicleId: dto.vehicleId,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed,
      heading: dto.heading,
      timestamp: event.recordedAt,
    });

    await this.gpsService.checkAlerts(dto);
    return { received: true };
  }

  @SubscribeMessage('subscribe:shipment')
  handleSubscribe(
    @MessageBody('shipmentId') shipmentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`shipment:${shipmentId}`);
    return { subscribed: shipmentId };
  }

  @SubscribeMessage('unsubscribe:shipment')
  handleUnsubscribe(
    @MessageBody('shipmentId') shipmentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`shipment:${shipmentId}`);
    return { unsubscribed: shipmentId };
  }

  broadcastAlert(shipmentId: string, alert: any) {
    this.server.to(`shipment:${shipmentId}`).emit('alert:triggered', alert);
  }
}
