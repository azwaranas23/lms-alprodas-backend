import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LessonsController } from './controllers/lessons.controller';
import { LessonsService } from './services/lessons.service';
import { LessonsRepository } from './repositories/lessons.repository';

@Module({
  imports: [AuthModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonsRepository],
  exports: [],
})
export class LessonsModule {}
