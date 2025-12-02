import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from 'src/common/interceptors/cache.interceptor';
import { SubjectsService } from '../services/subjects.service';
import { CacheKey, CacheTTL } from 'src/common/decorators/cache.decorator';
import { QuerySubjectsDto } from '../dto/query-subjects.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { SubjectsResponseDto } from '../dto/subjects-response.dto';

@Controller('front/subjects')
@UseInterceptors(CacheInterceptor)
export class FrontSubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @CacheKey('front_subjects')
  @CacheTTL(300)
  async findAll(
    @Query() query: QuerySubjectsDto,
  ): Promise<BaseResponse<PaginatedResponse<SubjectsResponseDto>>> {
    return this.subjectsService.findAll(query);
  }

  @Get('detail/:id')
  @CacheKey('front_subject_detail')
  @CacheTTL(300)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<SubjectsResponseDto>> {
    return this.subjectsService.findById(id);
  }

  @Get('by-topic/:topicId')
  @CacheKey('front_subjects_by_topic')
  @CacheTTL(300)
  async findByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: QuerySubjectsDto,
  ): Promise<BaseResponse<PaginatedResponse<SubjectsResponseDto>>> {
    return this.subjectsService.findAll({ ...query, topicId });
  }
}
