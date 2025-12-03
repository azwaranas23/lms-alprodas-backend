import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { CoursesRepository } from 'src/modules/courses/repositories/courses.repository';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { EnrollWithTokenResponseDto } from '../dto/enrollment-response.dto';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { EnrollWithTokenDto } from '../dto/enroll-with-token';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { UserFromToken } from 'src/common/utils/jwt.util';
import {
  CourseResponseDto,
  CourseWithEnrollmentDto,
} from 'src/modules/courses/dto/course-response.dto';
import { CompleteCourseResponseDto } from 'src/modules/courses/dto/complete-course-response.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  // ---------- Util / helper lama ----------

  async addEnrollmentStatus(
    courses: CourseResponseDto[],
    user?: UserFromToken,
  ): Promise<CourseWithEnrollmentDto[]> {
    if (!user || courses.length === 0) {
      return courses.map((course) => ({ ...course, isEnrolled: false }));
    }

    const courseIds = courses.map((course) => course.id);
    const enrollmentsMap =
      await this.enrollmentRepository.getEnrollmentsMapForUser(
        user.id,
        courseIds,
      );

    return courses.map((course) => ({
      ...course,
      isEnrolled: enrollmentsMap.has(course.id),
    }));
  }

  async completeCourse(
    userId: number,
    courseId: number,
  ): Promise<BaseResponse<{ success: boolean; certificateId: string }>> {
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      userId,
      courseId,
    );

    if (!enrollment) {
      throw new ForbiddenException('User is not enrolled in the course');
    }

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Course is already completed');
    }

    const completedEnrollment = await this.enrollmentRepository.completeCourse(
      userId,
      courseId,
    );

    return {
      message: 'Course completed successfully',
      data: {
        success: true,
        certificateId: completedEnrollment.certificateId!,
      },
    };
  }

  async getEnrollmentDetail(
    userId: number,
    courseId: number,
  ): Promise<BaseResponse<CompleteCourseResponseDto>> {
    const enrollment =
      await this.enrollmentRepository.getEnrollmentWithCourseDetails(
        userId,
        courseId,
      );

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const responseDto =
      this.enrollmentRepository.toCompleteCourseResponseDto(enrollment);

    return {
      message: 'Enrollment details retrieved successfully',
      data: responseDto,
    };
  }

  // ---------- Fitur baru: enroll dengan token ----------

  async enrollWithToken(
    user: UsersResponseDto,
    dto: EnrollWithTokenDto,
  ): Promise<BaseResponse<EnrollWithTokenResponseDto>> {
    const { course_id, token } = dto;

    const course = await this.coursesRepository.findById(course_id);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // TODO: sesuaikan nama field token di model Course Anda
    // misal: course.courseToken / course.classToken / course.token
    if (!course.courseToken || course.courseToken !== token) {
      throw new ForbiddenException('Invalid course token');
    }

    const existingEnrollment =
      await this.enrollmentRepository.findByStudentAndCourse(
        user.id,
        course.id,
      );

    if (existingEnrollment) {
      throw new BadRequestException('User already enrolled in this course');
    }

    await this.enrollmentRepository.create(user.id, course.id);

    await this.coursesRepository.updateCourseStudentCount(course.id);

    return {
      message: 'Enrollment successful',
      data: {
        success: true,
        courseId: course.id,
      },
    };
  }
}
