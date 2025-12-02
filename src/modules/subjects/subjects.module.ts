import { Module } from '@nestjs/common';
import { SubjectsService } from './services/subjects.service';
import { SubjectsRepository } from './repositories/subjects.repository';
import { SubjectsController } from './controllers/subjects.controller';
import { AuthModule } from '../auth/auth.module';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { FrontSubjectsController } from './controllers/front-subjects.controller';
import { CacheService } from 'src/common/services/cache.service';
import { RedisService } from 'src/common/services/redis.service';

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController, FrontSubjectsController],
  providers: [
    SubjectsService,
    SubjectsRepository,
    FileUploadService,
    CacheService,
    RedisService,
  ],
  exports: [],
})
export class SubjectsModule {}
