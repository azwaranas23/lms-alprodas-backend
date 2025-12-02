import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import {
  CourseResponseDto,
  CourseWithEnrollmentDto,
} from 'src/modules/courses/dto/course-response.dto';
import { UserFromToken } from 'src/common/utils/jwt.util';
import { UserRole } from 'src/common/enums/user-role.enum';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { EnrollmentStatus } from '@prisma/client';
import { CompleteCourseResponseDto } from 'src/modules/courses/dto/complete-course-response.dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async isUserEnrolledInCourse(
    userId: number,
    courseId: number,
  ): Promise<boolean> {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(
      userId,
      courseId,
    );
    return !!enrollment;
  }

  async addEnrollmentStatus(
    courses: CourseResponseDto[],
    user?: UserFromToken,
  ): Promise<CourseWithEnrollmentDto[]> {
    if (!user || courses.length === 0) {
      return courses.map((course) => ({ ...course, isEnrolled: false }));
    }

    if (user.role.key === UserRole.STUDENT) {
      const courseIds = courses.map((course) => course.id);

      const enrollments =
        await this.enrollmentRepository.getEnrollmentsMapForUser(
          user.id,
          courseIds,
        );

      return courses.map((course) => ({
        ...course,
        isEnrolled: enrollments.has(course.id),
      }));
    }

    if (user.role.key === UserRole.MENTOR) {
      return courses.map((course) => ({
        ...course,
        isEnrolled: course.mentor.id === user.id,
      }));
    }

    return courses.map((course) => ({ ...course, isEnrolled: false }));
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
}
