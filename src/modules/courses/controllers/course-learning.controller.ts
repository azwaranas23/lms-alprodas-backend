import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { CourseLearningService } from '../services/course-learning.service';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import {
  CourseProgressResponseDto,
  CourseWithProgressResponseDto,
  LessonCompleteResponseDto,
  LessonDetailResponseDto,
} from '../dto/course-learning/course-learning.dto';

@Controller('courses')
@UseGuards(PermissionsGuard)
export class CourseLearningController {
  constructor(private readonly courseLearningService: CourseLearningService) {}

  @Get(':courseId/learn')
  @Permissions('courses.read')
  async getCourseStructure(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<CourseWithProgressResponseDto>> {
    return this.courseLearningService.getCourseWithProgress(courseId, user.id);
  }

  @Get(':courseId/progress')
  @Permissions('courses.read')
  async getCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<CourseProgressResponseDto>> {
    return this.courseLearningService.getCourseProgress(courseId, user.id);
  }

  @Get('lessons/:lessonId')
  @Permissions('courses.read')
  async getLessonDetail(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<LessonDetailResponseDto>> {
    return this.courseLearningService.getLessonDetail(lessonId, user.id);
  }

  @Get('lessons/:lessonId/complete')
  @Permissions('courses.read')
  async completeLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<LessonCompleteResponseDto>> {
    return this.courseLearningService.markLessonAsCompletedAndGetNext(
      lessonId,
      user.id,
    );
  }
}
