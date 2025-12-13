import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from 'src/modules/users/dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { RegisterDto } from 'src/modules/users/dto/register.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Throttle({
    short: { ttl: 5000, limit: 5 }, // 5 requests per 5 seconds
    medium: { ttl: 900000, limit: 10 }, // 10 requests per 15 minutes
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<BaseResponse<AuthResponseDto>> {
    return this.authService.login(loginDto);
  }

  @Throttle({
    short: { ttl: 5000, limit: 5 }, // 5 requests per 5 seconds
    medium: { ttl: 900000, limit: 10 }, // 10 requests per 15 minutes
  })
  @Post('register')
  @UseInterceptors(
    FileInterceptor('avatar', FileUploadService.getAvatarMulterConfig()),
  )
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<BaseResponse<RegisterResponseDto>> {
    try {
      const avatarUrl = avatar
        ? this.fileUploadService.getAvatarUrl(avatar.filename)
        : undefined;

      const registerData = {
        ...registerDto,
        avatar: avatarUrl,
      };

      return this.authService.register(registerData);
    } catch (error) {
      if (avatar) {
        await this.fileUploadService.deleteAvatarByName(avatar.filename);
      }
      throw error;
    }
  }

  @Get('verify-email')
  async verifyEmail(
    @Query() query: VerifyEmailDto,
  ): Promise<BaseResponse<null>> {
    return this.authService.verifyEmail(query.token);
  }

  @Throttle({
    short: { ttl: 30000, limit: 1 }, // 1 request per 30 seconds
    long: { ttl: 3600000, limit: 3 }, // 3 requests per hour
  })
  @Post('resend-verification')
  async resendVerification(
    @Body() body: ResendVerificationDto,
  ): Promise<BaseResponse<null>> {
    return this.authService.resendVerificationEmail(body.email);
  }
  @Get('test-email')
  async testEmail() {
    return this.authService.sendTestEmail();
  }
}
