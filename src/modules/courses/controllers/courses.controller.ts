import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from '../services/courses.service';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { CourseResponseDto } from '../dto/course-response.dto';
import { QueryCourseDto } from '../dto/query-course.dto';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseImageType } from '../constants/course.constants';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { MyCourseResponseDto } from '../dto/my-course-response.dto';
import { CompleteCourseResponseDto } from '../dto/complete-course-response.dto';

@Controller('courses')
@UseGuards(PermissionsGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Get()
  @Permissions('courses.read')
  async findAll(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryCourseDto,
  ): Promise<BaseResponse<PaginatedResponse<CourseResponseDto>>> {
    return this.coursesService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('courses.read')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<CourseResponseDto | null>> {
    return this.coursesService.findById(id, user);
  }

  @Post()
  @Permissions('courses.create')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      4,
      FileUploadService.getMulterConfig({
        destination: './uploads/courses',
      }),
    ),
  )
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<BaseResponse<CourseResponseDto>> {
    return this.coursesService.create(createCourseDto, images);
  }

  @Patch(':id')
  @Permissions('courses.update')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      4,
      FileUploadService.getMulterConfig({
        destination: './uploads/courses',
      }),
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<BaseResponse<CourseResponseDto>> {
    return this.coursesService.update(id, updateCourseDto, images);
  }

  @Patch(':id/image/:type')
  @Permissions('courses.update')
  @UseInterceptors(
    FilesInterceptor(
      'image',
      1,
      FileUploadService.getMulterConfig({
        destination: './uploads/courses',
      }),
    ),
  )
  async updateImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: CourseImageType,
    @UploadedFiles() imageFiles?: Express.Multer.File[],
  ): Promise<BaseResponse<{ success: boolean }>> {
    if (!imageFiles || imageFiles.length === 0) {
      throw new BadRequestException('Image file is required');
    }

    return this.coursesService.updateCourseImage(id, type, imageFiles[0]);
  }

  @Delete(':id')
  //   @Permissions('courses.delete')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.coursesService.delete(id);
  }

  @Get('student/my-courses')
  @Permissions('courses.read')
  async getMyCourses(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryCourseDto,
  ): Promise<BaseResponse<PaginatedResponse<MyCourseResponseDto>>> {
    return this.coursesService.getMyCourses(user.id, query);
  }

  @Post(':id/complete')
  @Permissions('courses.read')
  async completeCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<{ success: boolean; certificateId: string }>> {
    return this.coursesService.completeCourse(user.id, id);
  }

  @Get(':id/enrollment')
  @Permissions('courses.read')
  async getEnrollmentDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<CompleteCourseResponseDto>> {
    return this.coursesService.enrollmentDetail(user.id, id);
  }

  @Get('mentor/students')
  @Permissions('courses.read')
  async getMentorStudents(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryCourseDto,
  ): Promise<BaseResponse<PaginatedResponse<any>>> {
    return this.coursesService.getMentorStudents(user.id, {
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }
}
