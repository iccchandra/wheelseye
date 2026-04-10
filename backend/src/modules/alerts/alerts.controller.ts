import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  getAll(
    @Query('shipmentId')  shipmentId?: string,
    @Query('acknowledged') acknowledged?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
  ) {
    return this.alertsService.findAll({ shipmentId, acknowledged, type, page });
  }

  @Get('unread')
  getUnread() {
    return this.alertsService.getUnread();
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertsService.acknowledge(id, 'ops');
  }
}
