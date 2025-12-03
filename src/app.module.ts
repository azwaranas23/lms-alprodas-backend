import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailService } from './common/services/email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './common/modules/queue.module';
import { CacheService } from './common/services/cache.service';
import { RedisService } from './common/services/redis.service';
import { PermissionModule } from './modules/permissions/permission.module';
import { RolesModule } from './modules/roles/roles.module';
import { TopicModule } from './modules/topics/topic.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { CourseModule } from './modules/courses/course.module';
import { SectionsModule } from './modules/sections/sections.module';
import { LessonsModule } from './modules/lessons/lesson.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { EnrollmentModule } from './modules/enrollments/enrollment.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 50, // 50 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 100, // 100 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 500, // 500 requests per minute
      },
    ]),
    QueueModule,
    PermissionModule,
    RolesModule,
    TopicModule,
    SubjectsModule,
    CourseModule,
    SectionsModule,
    LessonsModule,
    DashboardModule,
    UsersModule,
    WithdrawalsModule,
    CertificatesModule,
    EnrollmentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EmailService,
    CacheService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
