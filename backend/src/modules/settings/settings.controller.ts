import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  getAll() { return this.svc.getAll(); }

  @Get('group/:group')
  @ApiOperation({ summary: 'Get settings by group' })
  getByGroup(@Param('group') group: string) { return this.svc.getByGroup(group); }

  @Post()
  @ApiOperation({ summary: 'Set a config value' })
  set(@Body() body: { key: string; value: string; group?: string }) {
    return this.svc.set(body.key, body.value, body.group);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Set multiple config values' })
  bulkSet(@Body() body: { settings: Array<{ key: string; value: string; group?: string }> }) {
    return this.svc.bulkSet(body.settings);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List email templates' })
  getTemplates() { return this.svc.getTemplates(); }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) { return this.svc.getTemplate(id); }

  @Post('templates')
  @ApiOperation({ summary: 'Create email template' })
  createTemplate(@Body() body: { name: string; subject: string; body: string; placeholders?: string[] }) {
    return this.svc.createTemplate(body);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update email template' })
  updateTemplate(@Param('id') id: string, @Body() body: { subject?: string; body?: string }) {
    return this.svc.updateTemplate(id, body);
  }
}
