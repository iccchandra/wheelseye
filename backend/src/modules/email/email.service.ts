import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private settingsService: SettingsService) {}

  private async getTransporter() {
    const s = await this.settingsService.getByGroup('smtp');
    if (!s.smtp_host) throw new Error('SMTP not configured');
    return nodemailer.createTransport({
      host: s.smtp_host,
      port: Number(s.smtp_port) || 587,
      secure: s.smtp_security === 'SSL',
      auth: s.smtp_username ? { user: s.smtp_username, pass: s.smtp_password } : undefined,
    });
  }

  private async getFromAddress(): Promise<string> {
    const from = await this.settingsService.get('smtp_from_email');
    const company = await this.settingsService.get('company_name');
    return from ? `${company || 'FreightTrack'} <${from}>` : 'FreightTrack <noreply@freighttrack.in>';
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const from = await this.getFromAddress();
      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Email failed to ${to}: ${err.message}`);
      return false;
    }
  }

  async sendFromTemplate(
    to: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<boolean> {
    const templates = await this.settingsService.getTemplates();
    const template = templates.find(t => t.name === templateName);
    if (!template) {
      this.logger.warn(`Email template "${templateName}" not found`);
      return false;
    }

    let subject = template.subject || '';
    let body = template.body || '';

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.split(placeholder).join(value);
      body = body.split(placeholder).join(value);
    }

    const company = await this.settingsService.get('company_name') || 'FreightTrack';
    const html = this.wrapInLayout(body, company);
    return this.send(to, subject, html);
  }

  async sendBookingConfirmation(email: string, shipment: any): Promise<boolean> {
    return this.sendFromTemplate(email, 'booking_confirmation', {
      company_name: await this.settingsService.get('company_name') || 'FreightTrack',
      customer_name: shipment.consigneeName || 'Customer',
      tracking_number: shipment.trackingNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      scheduled_pickup: shipment.scheduledPickup ? new Date(shipment.scheduledPickup).toLocaleDateString('en-IN') : 'TBD',
      estimated_delivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN') : 'TBD',
      cargo: shipment.cargoDescription || '',
      amount: shipment.quotedAmount ? `₹${shipment.quotedAmount.toLocaleString('en-IN')}` : 'TBD',
    });
  }

  async sendTrackingLink(email: string, shipment: any, frontendUrl: string): Promise<boolean> {
    const trackingUrl = `${frontendUrl}/track/${shipment.trackingNumber}`;
    return this.sendFromTemplate(email, 'tracking_link', {
      company_name: await this.settingsService.get('company_name') || 'FreightTrack',
      customer_name: shipment.consigneeName || 'Customer',
      tracking_number: shipment.trackingNumber,
      tracking_url: trackingUrl,
      origin: shipment.origin,
      destination: shipment.destination,
    });
  }

  private wrapInLayout(body: string, companyName: string): string {
    return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:linear-gradient(135deg,#1a6dcc,#0d4a8a);padding:20px 24px">
    <div style="color:#fff;font-size:18px;font-weight:600">${companyName}</div>
  </td></tr>
  <tr><td style="padding:24px">${body}</td></tr>
  <tr><td style="padding:16px 24px;background:#f5f5f3;text-align:center;font-size:12px;color:#999">
    ${companyName} &mdash; Fleet Operations Platform
  </td></tr>
</table>
</body></html>`;
  }
}
