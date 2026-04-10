import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const OTP_STORE = new Map<string, { otp: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private cfg: ConfigService) {}

  async sendOtp(phone: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTP_STORE.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] ${phone} → ${otp}`);
    // TODO: send via MSG91 / WhatsApp
    return { message: 'OTP sent' };
  }

  async verifyOtp(phone: string, otp: string) {
    const record = OTP_STORE.get(phone);
    if (!record || record.otp !== otp || Date.now() > record.expiresAt)
      throw new UnauthorizedException('Invalid or expired OTP');
    OTP_STORE.delete(phone);
    const payload = { sub: phone, phone, role: 'ops' };
    return {
      access_token: this.jwtService.sign(payload),
      phone,
      role: 'ops',
    };
  }

  async validateToken(payload: any) {
    return { phone: payload.phone, role: payload.role };
  }
}
