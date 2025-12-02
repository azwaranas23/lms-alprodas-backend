import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionsService } from './services/permissions.service';
import { PermissionsRepository } from './repositories/permissions.repository';

@Module({
  imports: [AuthModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService],
})
export class PermissionModule {}
