import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from 'src/common/interceptors/cache.interceptor';
import { TopicsService } from '../services/topics.service';
import { CacheKey, CacheTTL } from 'src/common/decorators/cache.decorator';
import { QueryTopicsDto } from '../dto/query-topics.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { TopicResponseDto } from '../dto/topic-response.dto';

@Controller('front/topics')
@UseInterceptors(CacheInterceptor)
export class FrontTopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @CacheKey('front_topics')
  @CacheTTL(300)
  async findAll(
    @Query() query: QueryTopicsDto,
  ): Promise<BaseResponse<PaginatedResponse<TopicResponseDto>>> {
    return this.topicsService.findAll(query);
  }

  @Get(':id')
  @CacheKey('front_topic_detail')
  @CacheTTL(300)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<TopicResponseDto>> {
    return this.topicsService.findById(id);
  }
}
