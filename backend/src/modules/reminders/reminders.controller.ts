import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly svc: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder' })
  create(@Body() dto: CreateReminderDto) { return this.svc.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List reminders' })
  findAll(@Query() q: any) { return this.svc.findAll(q); }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s unread reminders' })
  getToday() { return this.svc.getToday(); }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming reminders (next 7 days)' })
  getUpcoming(@Query('days') days?: number) { return this.svc.getUpcoming(days); }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark reminder as read' })
  markAsRead(@Param('id') id: string) { return this.svc.markAsRead(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
