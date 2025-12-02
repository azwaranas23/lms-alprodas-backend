import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { RolesRepository } from './repositories/roles.repository';

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}
