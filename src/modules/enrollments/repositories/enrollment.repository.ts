import { Injectable } from '@nestjs/common';
import { Enrollment, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as crypto from 'crypto';
import { CompleteCourseResponseDto } from 'src/modules/courses/dto/complete-course-response.dto';
import {
  CompleteCourseEnrollment,
  completeCourseEnrollmentInclude,
} from '../types/enrollment.types';

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndCourse(
    studentId: number,
    courseId: number,
  ): Promise<Enrollment | null> {
    return this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
      },
    });
  }

  async create(studentId: number, courseId: number): Promise<Enrollment> {
    return this.prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
    });
  }

  async getEnrollmentsMapForUser(
    userId: number,
    courseIds: number[],
  ): Promise<Map<number, boolean>> {
    if (courseIds.length === 0) {
      return new Map();
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: userId,
        courseId: { in: courseIds },
      },
      select: {
        courseId: true,
      },
    });

    const enrollmentMap = new Map<number, boolean>();
    enrollments.forEach((enrollment) => {
      enrollmentMap.set(enrollment.courseId, true);
    });

    return enrollmentMap;
  }

  async findByStudentAndCourse(
    studentId: number,
    courseId: number,
  ): Promise<Enrollment | null> {
    return await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  }

  async completeCourse(
    studentId: number,
    courseId: number,
  ): Promise<CompleteCourseEnrollment> {
    const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    return this.prisma.enrollment.update({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      data: {
        progressPercentage: 100,
        status: EnrollmentStatus.COMPLETED,
        completedAt: new Date(),
        certificateId,
      },
      include: completeCourseEnrollmentInclude,
    });
  }

  async getEnrollmentWithCourseDetails(
    studentId: number,
    courseId: number,
  ): Promise<CompleteCourseEnrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: completeCourseEnrollmentInclude,
    });
  }

  toCompleteCourseResponseDto(
    completedEnrollment: CompleteCourseEnrollment,
  ): CompleteCourseResponseDto {
    return {
      id: completedEnrollment.id,
      studentId: completedEnrollment.studentId,
      courseId: completedEnrollment.courseId,
      status: completedEnrollment.status,
      progressPercentage: Number(completedEnrollment.progressPercentage),
      enrolledAt: completedEnrollment.enrolledAt,
      completedAt: completedEnrollment.completedAt!,
      certificateId: completedEnrollment.certificateId!,
      course: {
        id: completedEnrollment.course.id,
        title: completedEnrollment.course.title,
        description: completedEnrollment.course.description,
        about: completedEnrollment.course.about,
        tools: completedEnrollment.course.tools,
        status: completedEnrollment.course.status,
        totalLessons: completedEnrollment.course.totalLessons,
        totalStudents: completedEnrollment.course.totalStudents,
        createdAt: completedEnrollment.course.createdAt,
        updatedAt: completedEnrollment.course.updatedAt,
        subject: {
          id: completedEnrollment.course.subject.id,
          name: completedEnrollment.course.subject.name,
          topic: {
            id: completedEnrollment.course.subject.topic.id,
            name: completedEnrollment.course.subject.topic.name,
          },
        },
        mentor: {
          id: completedEnrollment.course.mentor.id,
          email: completedEnrollment.course.mentor.email,
          name: completedEnrollment.course.mentor.name,
          profile: completedEnrollment.course.mentor.userProfile
            ? {
                bio: completedEnrollment.course.mentor.userProfile.bio,
                avatar: completedEnrollment.course.mentor.userProfile.avatar,
              }
            : null,
        },
        images: completedEnrollment.course.courseImages.map((image) => ({
          id: image.id,
          imagePath: image.imagePath,
          orderIndex: image.orderIndex,
        })),
        sections: completedEnrollment.course.courseSections.map((section) => ({
          id: section.id,
          title: section.title,
          description: section.description,
          orderIndex: section.orderIndex,
          totalLessons: section.totalLessons,
          lessons: section.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            contentType: lesson.contentType,
            contentUrl: lesson.contentUrl,
            contentText: lesson.contentText,
            durationMinutes: lesson.durationMinutes,
            orderIndex: lesson.orderIndex,
            isActive: lesson.isActive,
          })),
        })),
      },
    };
  }
}
