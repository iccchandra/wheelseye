import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body('phone') phone: string) {
    return this.auth.sendOtp(phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get JWT token' })
  verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.auth.verifyOtp(phone, otp);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info from token' })
  getMe(@Request() req: any) {
    return { phone: req.user.phone, role: req.user.role };
  }
}
