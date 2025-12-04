import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CoursesResourceService } from '../services/courses-resource.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { CourseResourceResponseDto } from '../dto/course-resource/course-resource-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';

@Controller('student/courses/:courseId/resources')
@UseGuards(JwtAuthGuard)
export class StudentCourseResourcesController {
  constructor(
    private readonly coursesResourceService: CoursesResourceService,
  ) {}

  @Get()
  async findByCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<BaseResponse<CourseResourceResponseDto[]>> {
    return this.coursesResourceService.findByCourseId(courseId);
  }
}
