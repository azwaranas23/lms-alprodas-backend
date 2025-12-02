import { Module } from '@nestjs/common';
import { TopicsController } from './controllers/topics.controller';
import { TopicsService } from './services/topics.service';
import { TopicsRepository } from './repositories/topics.repository';
import { AuthModule } from '../auth/auth.module';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { FrontTopicsController } from './controllers/front-topics.controller';
import { CacheService } from 'src/common/services/cache.service';
import { RedisService } from 'src/common/services/redis.service';

@Module({
  imports: [AuthModule],
  controllers: [TopicsController, FrontTopicsController],
  providers: [
    TopicsService,
    TopicsRepository,
    FileUploadService,
    CacheService,
    RedisService,
  ],
  exports: [TopicsService],
})
export class TopicModule {}
