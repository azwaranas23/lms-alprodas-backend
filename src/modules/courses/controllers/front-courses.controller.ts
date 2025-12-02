import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { QueryCourseDto } from '../dto/query-course.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { CourseResponseDto } from '../dto/course-response.dto';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { CourseStatus } from '@prisma/client';

@Controller('front/courses')
export class FrontCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(
    @Query() query: QueryCourseDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<BaseResponse<PaginatedResponse<CourseResponseDto>>> {
    const user = JwtUtil.extractUserFromToken(authHeader);

    const frontQuery = { ...query, status: CourseStatus.PUBLISHED };
    return this.coursesService.findAll(frontQuery, user);
  }

  @Get('by-topic/:topicId')
  async findByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: QueryCourseDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<BaseResponse<PaginatedResponse<CourseResponseDto>>> {
    const user = JwtUtil.extractUserFromToken(authHeader);

    const frontQuery = { ...query, status: CourseStatus.PUBLISHED, topicId };
    return this.coursesService.findAll(frontQuery, user);
  }

  @Get('by-subject/:subjectId')
  async findBySubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query() query: QueryCourseDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<BaseResponse<PaginatedResponse<CourseResponseDto>>> {
    const user = JwtUtil.extractUserFromToken(authHeader);

    const frontQuery = { ...query, status: CourseStatus.PUBLISHED, subjectId };
    return this.coursesService.findAll(frontQuery, user);
  }

  @Get('detail/:id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authHeader?: string,
  ): Promise<BaseResponse<CourseResponseDto | null>> {
    const user = JwtUtil.extractUserFromToken(authHeader);
    return this.coursesService.findById(id, user);
  }

  @Get('most-joined')
  async findMostJoined(
    @Headers('authorization') authHeader?: string,
  ): Promise<BaseResponse<CourseResponseDto[]>> {
    const user = JwtUtil.extractUserFromToken(authHeader);
    return this.coursesService.findMostJoined(3, user);
  }
}
