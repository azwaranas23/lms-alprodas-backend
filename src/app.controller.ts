import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';
import { BaseResponse } from './common/interface/base-response.interface';
import { Role } from '@prisma/client';
import { CurrentUser } from './modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from './modules/users/dto/users-response.dto';
import { JwtAuthGuard } from './modules/auth/guards/jwt.guard';
import { EmailService } from './common/services/email.service';
import { QueueService } from './common/services/queue.service';
import { CacheService } from './common/services/cache.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-roles')
  async testRoles(): Promise<BaseResponse<Role[]>> {
    const roles = await this.prisma.role.findMany();
    return {
      message: 'Roles retrieved successfully',
      data: roles,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: UsersResponseDto) {
    return user;
  }

  @Get('test-email')
  async testEmail(): Promise<BaseResponse<boolean>> {
    const result = await this.emailService.sendTestEmail();
    return {
      message: 'Test email sent successfully',
      data: result,
    };
  }

  @Get('test-email-queue')
  async testQueue(): Promise<BaseResponse<boolean>> {
    await this.queueService.sendEmailViaQueue();
    return {
      message: 'Test job added to queue successfully',
      data: true,
    };
  }

  @Get('test-cache')
  async testCache(): Promise<BaseResponse<boolean>> {
    const key = 'test:key';
    const value = { message: 'Hello, world!' };

    await this.cacheService.set(key, value);
    const cachedValue = await this.cacheService.get(key);

    return {
      message: 'Cache test completed successfully',
      data: cachedValue === value,
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
