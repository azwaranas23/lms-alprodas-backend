import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SectionsController } from './controllers/sections.controller';
import { SectionsRepository } from './repositories/sections.repository';
import { SectionsService } from './services/sections.service';

@Module({
  imports: [AuthModule],
  controllers: [SectionsController],
  providers: [SectionsRepository, SectionsService],
  exports: [],
})
export class SectionsModule {}
