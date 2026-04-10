import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AppSetting, EmailTemplate } from './settings.model';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(AppSetting) private settingModel: typeof AppSetting,
    @InjectModel(EmailTemplate) private templateModel: typeof EmailTemplate,
  ) {}

  // --- Settings ---
  async getAll(): Promise<Record<string, string>> {
    const settings = await this.settingModel.findAll();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async getByGroup(group: string): Promise<Record<string, string>> {
    const settings = await this.settingModel.findAll({ where: { group } });
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  }

  async get(key: string): Promise<string | null> {
    const s = await this.settingModel.findOne({ where: { key } });
    return s?.value || null;
  }

  async set(key: string, value: string, group?: string): Promise<AppSetting> {
    const [setting] = await this.settingModel.upsert({ key, value, group } as any);
    return setting;
  }

  async bulkSet(settings: Array<{ key: string; value: string; group?: string }>): Promise<void> {
    for (const s of settings) {
      await this.settingModel.upsert({ key: s.key, value: s.value, group: s.group } as any);
    }
  }

  // --- Email Templates ---
  async getTemplates(): Promise<EmailTemplate[]> {
    return this.templateModel.findAll({ order: [['name', 'ASC']] });
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    const t = await this.templateModel.findByPk(id);
    if (!t) throw new NotFoundException(`Template ${id} not found`);
    return t;
  }

  async updateTemplate(id: string, data: { subject?: string; body?: string }): Promise<EmailTemplate> {
    const t = await this.getTemplate(id);
    return t.update(data);
  }

  async createTemplate(data: { name: string; subject: string; body: string; placeholders?: string[] }): Promise<EmailTemplate> {
    return this.templateModel.create(data as any);
  }
}
