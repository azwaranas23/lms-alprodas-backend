import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesRepository } from '../repositories/courses.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import {
  CourseResponseDto,
  CourseWithEnrollmentDto,
} from '../dto/course-response.dto';
import { QueryCourseDto } from '../dto/query-course.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { CreateCourseDto } from '../dto/create-course.dto';
import {
  cleanupUploadedFiles,
  deleteFiles,
} from 'src/common/utils/file-cleanup.util';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { Prisma } from '@prisma/client';
import { UpdateCourseDto } from '../dto/update-course.dto';
import {
  COURSE_DEFAULT_LIMIT,
  COURSE_IMAGE_TYPE_TO_ORDER,
  CourseImageType,
} from '../constants/course.constants';
import { UserFromToken } from 'src/common/utils/jwt.util';
import { EnrollmentService } from 'src/modules/transactions/services/enrollment.service';
import { MyCourseResponseDto } from '../dto/my-course-response.dto';
import { CompleteCourseResponseDto } from '../dto/complete-course-response.dto';
import { generateCourseToken } from 'src/common/utils/course-token.util';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  private async generateUniqueEnrollmentToken(): Promise<string> {
    while (true) {
      const token = generateCourseToken();
      const exists = await this.coursesRepository.findByEnrollmentToken(token);
      if (!exists) return token;
    }
  }

  async findAll(
    query: QueryCourseDto,
    user?: { id: number; role: { key: string } },
  ): Promise<BaseResponse<PaginatedResponse<CourseResponseDto>>> {
    const result = await this.coursesRepository.findMany(query, user);

    const { courses, total, page, limit } = result;

    const coursesResponse = this.coursesRepository.toResponseDtos(courses);

    const courseWithEnrollmentStatus =
      await this.enrollmentService.addEnrollmentStatus(coursesResponse, user);

    const paginatedData = PaginationUtil.createResponse(
      courseWithEnrollmentStatus,
      page,
      limit,
      total,
    );

    return {
      message: 'Courses retrieved successfully',
      data: paginatedData,
    };
  }

  async findById(
    id: number,
    user?: UserFromToken,
  ): Promise<BaseResponse<CourseResponseDto | null>> {
    const course = await this.coursesRepository.findByIdWithRelations(id);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const courseDto = this.coursesRepository.toResponseDto(course);

    const [courseWithEnrollmentStatus] =
      await this.enrollmentService.addEnrollmentStatus([courseDto], user);

    return {
      message: 'Course retrieved successfully',
      data: courseWithEnrollmentStatus,
    };
  }

  async create(
    createCourseDto: CreateCourseDto,
    images?: Express.Multer.File[],
  ): Promise<BaseResponse<CourseResponseDto>> {
    if (!images || images.length === 0) {
      throw new BadRequestException('Course images are required');
    }

    try {
      // ⬇️ generate token kalau DTO belum punya
      if (!createCourseDto.enrollment_token) {
        createCourseDto.enrollment_token =
          await this.generateUniqueEnrollmentToken();
      }

      const course = await this.prisma.$transaction(async (tx) => {
        const createdCourse = await this.coursesRepository.create(
          createCourseDto,
          tx,
        );

        if (images && images.length > 0) {
          const imageTypes = this.processImageUploads(images);
          await this.coursesRepository.createCourseImages(
            createdCourse.id,
            imageTypes,
            tx,
          );
        }

        await this.updateCourseRelations(
          createdCourse.id,
          createCourseDto.key_points,
          createCourseDto.personas,
          tx,
        );

        await this.coursesRepository.updateSubjectCourseCount(
          createdCourse.subjectId,
          tx,
        );

        return createdCourse;
      });

      const courseWithRelations =
        await this.coursesRepository.findByIdWithRelations(course.id);

      if (!courseWithRelations) {
        throw new NotFoundException('Course not found after creation');
      }

      const courseResponse =
        this.coursesRepository.toResponseDto(courseWithRelations);

      return {
        message: 'Course created successfully',
        data: courseResponse,
      };
    } catch (error) {
      if (images?.length) {
        await cleanupUploadedFiles(images);
      }
      throw error;
    }
  }

  async update(
    id: number,
    data: UpdateCourseDto,
    images?: Express.Multer.File[],
  ): Promise<BaseResponse<CourseResponseDto>> {
    const existingCourse = await this.coursesRepository.findById(id);

    if (!existingCourse) {
      if (images?.length) {
        await cleanupUploadedFiles(images);
      }
      throw new NotFoundException('Course not found');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.coursesRepository.update(id, data, tx);

        if (images && images.length > 0) {
          const imageTypes = this.processImageUploads(images);
          await this.coursesRepository.deleteCourseImages(id, tx);
          await this.coursesRepository.createCourseImages(id, imageTypes, tx);
        }

        await this.updateCourseRelations(
          id,
          data.key_points,
          data.personas,
          tx,
        );

        if (data.subject_id && data.subject_id !== existingCourse.subjectId) {
          await Promise.all([
            this.coursesRepository.updateSubjectCourseCount(
              existingCourse.subjectId,
              tx,
            ),
            this.coursesRepository.updateSubjectCourseCount(
              data.subject_id,
              tx,
            ),
          ]);
        }
      });

      const updatedCourse =
        await this.coursesRepository.findByIdWithRelations(id);

      if (!updatedCourse) {
        throw new NotFoundException('Course not found after update');
      }

      const courseResponse =
        this.coursesRepository.toResponseDto(updatedCourse);
      return {
        message: 'Course updated successfully',
        data: courseResponse,
      };
    } catch (error) {
      if (images?.length) {
        await cleanupUploadedFiles(images);
      }
      throw error;
    }
  }

  async updateCourseImage(
    courseId: number,
    imageType: CourseImageType,
    image: Express.Multer.File,
  ): Promise<BaseResponse<{ success: boolean }>> {
    const existingCourse = await this.coursesRepository.findById(courseId);

    if (!existingCourse) {
      await cleanupUploadedFiles([image]);
      throw new NotFoundException('Course not found');
    }

    const orderIndex = COURSE_IMAGE_TYPE_TO_ORDER[imageType];

    try {
      await this.coursesRepository.updateCourseImage(
        courseId,
        orderIndex,
        this.fileUploadService.getFileUrl(image.filename, 'uploads/courses'),
      );
      return {
        message: 'Course image updated successfully',
        data: { success: true },
      };
    } catch (error) {
      await cleanupUploadedFiles([image]);
      throw error;
    }
  }

  async delete(id: number): Promise<BaseResponse<null>> {
    const existingCourse =
      await this.coursesRepository.findByIdWithRelations(id);

    if (!existingCourse) {
      throw new NotFoundException('Course not found');
    }

    const imagePaths = existingCourse.courseImages.map((img) => img.imagePath);
    await this.prisma.$transaction(async (tx) => {
      await this.coursesRepository.delete(id, tx);
      await this.coursesRepository.updateSubjectCourseCount(
        existingCourse.subjectId,
        tx,
      );
    });

    await deleteFiles(imagePaths);

    return {
      message: 'Course deleted successfully',
      data: null,
    };
  }

  private processImageUploads(images: Express.Multer.File[]): {
    main?: string;
    preview?: string;
    sample?: string;
    certificate?: string;
  } {
    return {
      main: images[0]
        ? this.fileUploadService.getFileUrl(
            images[0].filename,
            'uploads/courses',
          )
        : undefined,
      preview: images[1]
        ? this.fileUploadService.getFileUrl(
            images[1].filename,
            'uploads/courses',
          )
        : undefined,
      sample: images[2]
        ? this.fileUploadService.getFileUrl(
            images[2].filename,
            'uploads/courses',
          )
        : undefined,
      certificate: images[3]
        ? this.fileUploadService.getFileUrl(
            images[3].filename,
            'uploads/courses',
          )
        : undefined,
    };
  }

  private async updateCourseRelations(
    courseId: number,
    keyPoints?: string[],
    personas?: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (keyPoints !== undefined) {
      await this.coursesRepository.deleteCourseKeyPoints(courseId, tx);
      if (keyPoints.length > 0) {
        await this.coursesRepository.createCourseKeyPoints(
          courseId,
          keyPoints,
          tx,
        );
      }
    }

    if (personas !== undefined) {
      await this.coursesRepository.deleteCoursePersonas(courseId, tx);
      if (personas.length > 0) {
        await this.coursesRepository.createCoursePersonas(
          courseId,
          personas,
          tx,
        );
      }
    }
  }

  async findMostJoined(
    limit: number = COURSE_DEFAULT_LIMIT,
    user?: UserFromToken,
  ): Promise<BaseResponse<CourseWithEnrollmentDto[]>> {
    const courses = await this.coursesRepository.findMostJoined(limit);
    const coursesResponse = this.coursesRepository.toResponseDtos(courses);

    const courseWithEnrollmentsStatus =
      await this.enrollmentService.addEnrollmentStatus(coursesResponse, user);

    return {
      message: 'Most joined courses retrieved successfully',
      data: courseWithEnrollmentsStatus,
    };
  }

  async getMyCourses(
    studentId: number,
    query: QueryCourseDto,
  ): Promise<BaseResponse<PaginatedResponse<MyCourseResponseDto>>> {
    const result = await this.coursesRepository.findEnrolledCourses(
      studentId,
      query,
    );

    const { courses, total, page, limit } = result;

    const paginatedData = PaginationUtil.createResponse(
      courses,
      page,
      limit,
      total,
    );

    return {
      message: 'My courses retrieved successfully',
      data: paginatedData,
    };
  }

  async completeCourse(
    userId: number,
    courseId: number,
  ): Promise<BaseResponse<{ success: boolean; certificateId: string }>> {
    const course = await this.coursesRepository.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.enrollmentService.completeCourse(userId, courseId);
  }

  async enrollmentDetail(
    userId: number,
    courseId: number,
  ): Promise<BaseResponse<CompleteCourseResponseDto>> {
    const course = await this.coursesRepository.findById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.enrollmentService.getEnrollmentDetail(userId, courseId);
  }
}
