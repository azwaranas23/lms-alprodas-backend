import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesLearningRepository } from '../repositories/courses-learning.repository';
import { EnrollmentRepository } from 'src/modules/enrollments/repositories/enrollment.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import {
  CourseProgressResponseDto,
  CourseWithProgressResponseDto,
  LessonCompleteResponseDto,
  LessonDetailResponseDto,
} from '../dto/course-learning/course-learning.dto';
import { LessonsRepository } from 'src/modules/lessons/repositories/lessons.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CourseLearningService {
  constructor(
    private readonly coursesLearningRepository: CoursesLearningRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly lessonRepository: LessonsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getCourseWithProgress(
    courseId: number,
    studentId: number,
  ): Promise<BaseResponse<CourseWithProgressResponseDto>> {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(
      studentId,
      courseId,
    );

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const course =
      await this.coursesLearningRepository.findCourseWithProgressForStudent(
        courseId,
        studentId,
      );

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const progressStats =
      await this.coursesLearningRepository.getCourseCompletionStats(
        studentId,
        courseId,
      );

    if (!progressStats) {
      throw new NotFoundException('Progress stats not found');
    }

    const courseWithProgressDto =
      this.coursesLearningRepository.toCourseWithProgressResponseDto(
        course,
        progressStats,
      );

    return {
      message: 'Course with progress retrieved successfully',
      data: courseWithProgressDto,
    };
  }

  async getCourseProgress(
    courseId: number,
    studentId: number,
  ): Promise<BaseResponse<CourseProgressResponseDto>> {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(
      studentId,
      courseId,
    );

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const [progressList, stats] = await Promise.all([
      this.coursesLearningRepository.getProgressByCourse(courseId, studentId),
      this.coursesLearningRepository.getCourseCompletionStats(
        studentId,
        courseId,
      ),
    ]);

    if (!stats) {
      throw new NotFoundException('Progress stats not found');
    }

    const courseProgressDto =
      this.coursesLearningRepository.toCourseProgressResponseDto(
        courseId,
        stats,
        progressList,
      );

    return {
      message: 'Course progress retrieved successfully',
      data: courseProgressDto,
    };
  }

  async getLessonDetail(
    lessonId: number,
    studentId: number,
  ): Promise<BaseResponse<LessonDetailResponseDto>> {
    const lesson = await this.coursesLearningRepository.getLessonWithNavigation(
      lessonId,
      studentId,
    );

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const lessonDetailDto =
      this.coursesLearningRepository.toLessonDetailResponseDto(lesson);

    return {
      message: 'Lesson detail retrieved successfully',
      data: lessonDetailDto,
    };
  }

  async markLessonAsCompletedAndGetNext(
    lessonId: number,
    studentId: number,
  ): Promise<BaseResponse<LessonCompleteResponseDto>> {
    const lesson =
      await this.lessonRepository.findByIdWithSectionAndCourse(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      lesson.section.courseId,
    );

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await this.coursesLearningRepository.markAsCompleted(
        studentId,
        lessonId,
        tx,
      );

      await this.coursesLearningRepository.updateEnrollmentProgress(
        studentId,
        lesson.section.courseId,
        tx,
      );

      const [nextLesson, progressStats] = await Promise.all([
        this.coursesLearningRepository.getNextLesson(lessonId),
        this.coursesLearningRepository.getCourseCompletionStats(
          studentId,
          lesson.section.courseId,
        ),
      ]);

      if (!progressStats) {
        throw new NotFoundException('Progress stats not found');
      }

      return {
        nextLesson,
        progressStats,
      };
    });

    const currentLesson = {
      id: lesson.id,
      title: lesson.title,
      orderIndex: lesson.orderIndex,
    };

    const lessonCompleteDto =
      this.coursesLearningRepository.toLessonCompleteResponseDto(
        currentLesson,
        result.nextLesson,
        result.progressStats,
      );

    return {
      message: 'Lesson marked as completed',
      data: lessonCompleteDto,
    };
  }
}
