import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesRepository } from '../repositories/courses.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { CourseResourceResponseDto } from '../dto/course-resource/course-resource-response.dto';
import { CreateCourseResourceDto } from '../dto/course-resource/create-course-resource.dto';
import {
  cleanupUploadedFiles,
  deleteFile,
} from 'src/common/utils/file-cleanup.util';
import { UpdateCourseResourceData } from '../types/course-resource.types';

@Injectable()
export class CoursesResourceService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  async findByCourseId(
    courseId: number,
  ): Promise<BaseResponse<CourseResourceResponseDto[]>> {
    const courses =
      await this.coursesRepository.findByIdWithRelations(courseId);

    if (!courses) {
      throw new NotFoundException('Course not found');
    }

    return {
      message: 'Course resources retrieved successfully',
      data: courses.courseResources.map((resource) =>
        this.coursesRepository.toResourceResponseDto(resource),
      ),
    };
  }

  async create(
    courseId: number,
    createCourseResourceDto: CreateCourseResourceDto,
    file: Express.Multer.File,
  ): Promise<BaseResponse<CourseResourceResponseDto>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const course = await this.coursesRepository.findById(courseId);

    if (!course) {
      await cleanupUploadedFiles([file]);
      throw new NotFoundException('Course not found');
    }

    const createdResource = await this.coursesRepository.createCourseResource(
      courseId,
      {
        resourceType: createCourseResourceDto.resource_type || file.mimetype,
        resourcePath: file.path,
        fileName: createCourseResourceDto.name || file.originalname,
        fileSize: file.size,
      },
    );

    return {
      message: 'Course resource created successfully',
      data: this.coursesRepository.toResourceResponseDto(createdResource),
    };
  }

  async update(
    id: number,
    updateCourseResourceDto: CreateCourseResourceDto,
    file?: Express.Multer.File,
  ): Promise<BaseResponse<CourseResourceResponseDto>> {
    const existingResource =
      await this.coursesRepository.findCourseResourceById(id);

    if (!existingResource) {
      if (file) {
        await cleanupUploadedFiles([file]);
      }
      throw new NotFoundException('Course resource not found');
    }

    const updateData: UpdateCourseResourceData = {};

    if (updateCourseResourceDto.resource_type) {
      updateData.resourceType = updateCourseResourceDto.resource_type;
    }

    if (updateCourseResourceDto.name) {
      updateData.fileName = updateCourseResourceDto.name;
    }

    if (file) {
      await deleteFile(existingResource.resourcePath);

      updateData.resourcePath = file.path;
      updateData.fileSize = file.size;
      updateData.resourceType =
        updateCourseResourceDto.resource_type || file.mimetype;
      updateData.fileName = updateCourseResourceDto.name || file.originalname;
    }

    const updatedResource = await this.coursesRepository.updateCourseResource(
      id,
      updateData,
    );

    return {
      message: 'Course resource updated successfully',
      data: this.coursesRepository.toResourceResponseDto(updatedResource),
    };
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingResource =
      await this.coursesRepository.findCourseResourceById(id);

    if (!existingResource) {
      throw new NotFoundException('Course resource not found');
    }

    await this.coursesRepository.deleteCourseResource(id);
    await deleteFile(existingResource.resourcePath);

    return {
      message: 'Course resource deleted successfully',
      data: null,
    };
  }
}
