import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesResourceService } from '../services/courses-resource.service';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CourseResourceResponseDto } from '../dto/course-resource/course-resource-response.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCourseResourceDto } from '../dto/course-resource/create-course-resource.dto';
import { UpdateCourseResourceDto } from '../dto/course-resource/update-course-resource.dto';

@Controller('courses/:courseId/resources')
@UseGuards(PermissionsGuard)
export class CoursesResourceController {
  constructor(
    private readonly coursesResourceService: CoursesResourceService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @Permissions('courses.read')
  async findByCourseId(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<BaseResponse<CourseResourceResponseDto[]>> {
    return this.coursesResourceService.findByCourseId(courseId);
  }

  @Post()
  @Permissions('courses.update')
  @UseInterceptors(
    FileInterceptor(
      'file',
      FileUploadService.getMulterConfig({
        destination: './uploads/courses/resources',
        allowedTypes: /\.(pdf|docx|pptx|xlsx|zip|rar|jpg|jpeg|png|webp)$/,
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypesMessage: 'Only document and image files are allowed',
      }),
    ),
  )
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createDto: CreateCourseResourceDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseResponse<CourseResourceResponseDto>> {
    return this.coursesResourceService.create(courseId, createDto, file);
  }

  @Patch(':id')
  @Permissions('courses.update')
  @UseInterceptors(
    FileInterceptor(
      'file',
      FileUploadService.getMulterConfig({
        destination: './uploads/courses/resources',
        allowedTypes: /\.(pdf|docx|pptx|xlsx|zip|rar|jpg|jpeg|png|webp)$/,
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypesMessage: 'Only document and image files are allowed',
      }),
    ),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCourseResourceDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BaseResponse<CourseResourceResponseDto>> {
    return this.coursesResourceService.update(id, updateDto, file);
  }

  @Delete(':id')
  @Permissions('courses.update')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<null>> {
    return this.coursesResourceService.delete(id);
  }
}
