import { Injectable } from '@nestjs/common';
import { YOUTUBE_CONSTANTS } from 'src/common/constants/app.constants';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  courseWithProgressInclude,
  CourseWithRelations,
  LessonData,
  LessonProgressWithLesson,
  LessonWithNavigation,
  MentorData,
  ProgressStats,
  SectionData,
  SimpleLesson,
  SubjectData,
} from '../types/course-learning.types';
import {
  CourseWithProgressData,
  LessonWithProgress,
  SectionWithLessonsProgress,
} from '../interfaces/lesson-progress.interface';
import {
  CourseProgressResponseDto,
  CourseWithProgressResponseDto,
  LessonCompleteResponseDto,
  LessonDetailResponseDto,
} from '../dto/course-learning/course-learning.dto';
import { EnrollmentStatus, LessonProgress, Prisma } from '@prisma/client';

@Injectable()
export class CoursesLearningRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatVideoUrl(
    url: string | null,
    contentType: string,
  ): string | null {
    if (!url || contentType !== 'VIDEO') {
      return url;
    }

    return `${YOUTUBE_CONSTANTS.EMBED_BASE_URL}${url}`;
  }

  private async calculateProgressStats(
    studentId: number,
    courseId: number,
  ): Promise<ProgressStats> {
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          section: {
            courseId,
          },
          isActive: true,
        },
      }),
      this.prisma.lessonProgress.count({
        where: {
          studentId,
          isCompleted: true,
          lesson: {
            section: {
              courseId,
            },
            isActive: true,
          },
        },
      }),
    ]);

    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      totalLessons,
      completedLessons,
      percentage,
    };
  }

  async getCourseCompletionStats(
    studentId: number,
    courseId: number,
  ): Promise<ProgressStats | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (!enrollment) {
      return null;
    }

    return this.calculateProgressStats(studentId, courseId);
  }

  private mapToSubject(subject: SubjectData) {
    return {
      id: subject.id,
      name: subject.name,
      topic: {
        id: subject.topic.id,
        name: subject.topic.name,
      },
    };
  }

  private mapMentor(mentor: MentorData) {
    return {
      id: mentor.id,
      name: mentor.name,
      avatar: mentor.userProfile?.avatar || null,
    };
  }

  private getFirstImage(images: Array<{ imagePath: string }>): string | null {
    return images.length > 0 ? images[0].imagePath : null;
  }

  private mapLessonProgress(
    lessonProgress?: Array<{ isCompleted: boolean; completedAt: Date | null }>,
  ) {
    const hasProgress = lessonProgress && lessonProgress.length > 0;

    return hasProgress
      ? {
          isCompleted: lessonProgress[0].isCompleted,
          completedAt: lessonProgress[0].completedAt,
        }
      : { isCompleted: false, completedAt: null };
  }

  private mapLessonWithProgress(lesson: LessonData): LessonWithProgress {
    return {
      id: lesson.id,
      title: lesson.title,
      contentType: lesson.contentType,
      contentUrl: this.formatVideoUrl(lesson.contentUrl, lesson.contentType),
      contentText: lesson.contentText,
      durationMinutes: lesson.durationMinutes,
      orderIndex: lesson.orderIndex,
      isActive: lesson.isActive,
      progress: this.mapLessonProgress(lesson.lessonProgress),
    };
  }

  private mapSectionWithLessons(
    section: SectionData,
  ): SectionWithLessonsProgress {
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex,
      totalLessons: section.totalLessons,
      lessons: section.lessons.map((lesson) =>
        this.mapLessonWithProgress(lesson),
      ),
    };
  }

  private async getCourseWithRelations(courseId: number, studentId: number) {
    const include = {
      ...courseWithProgressInclude,
      courseSections: {
        ...courseWithProgressInclude.courseSections,
        include: {
          ...courseWithProgressInclude.courseSections.include,
          lessons: {
            ...courseWithProgressInclude.courseSections.include.lessons,
            include: {
              ...courseWithProgressInclude.courseSections.include.lessons
                .include,
              lessonProgress: {
                where: { studentId },
              },
            },
          },
        },
      },
    };

    return this.prisma.course.findUnique({
      where: { id: courseId },
      include,
    });
  }

  private mapToCourseWithProgress(
    course: CourseWithRelations,
  ): CourseWithProgressData {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      totalLessons: course.totalLessons,
      subject: this.mapToSubject(course.subject),
      mentor: this.mapMentor(course.mentor),
      image: this.getFirstImage(course.courseImages),
      sections: course.courseSections.map((section) =>
        this.mapSectionWithLessons(section),
      ),
    };
  }

  async findCourseWithProgressForStudent(
    courseId: number,
    studentId: number,
  ): Promise<CourseWithProgressData | null> {
    const course = await this.getCourseWithRelations(courseId, studentId);

    if (!course) {
      return null;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (!enrollment) {
      return null;
    }

    return this.mapToCourseWithProgress(course);
  }

  toCourseWithProgressResponseDto(
    course: CourseWithProgressData,
    progressStats: ProgressStats,
  ): CourseWithProgressResponseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      totalLessons: course.totalLessons,
      subject: course.subject,
      mentor: {
        ...course.mentor,
        avatar: course.mentor.avatar || null,
      },
      image: course.image || null,
      sections: course.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => ({
          ...lesson,
          contentUrl: lesson.contentUrl || null,
          contentText: lesson.contentText || null,
          progress: lesson.progress,
        })),
      })),
      progressStats,
    };
  }

  async getProgressByCourse(
    courseId: number,
    studentId: number,
  ): Promise<LessonProgressWithLesson[]> {
    return this.prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          section: {
            courseId,
          },
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            sectionId: true,
          },
        },
      },
      orderBy: [
        {
          lesson: {
            section: {
              orderIndex: 'asc',
            },
          },
        },
        {
          lesson: {
            orderIndex: 'asc',
          },
        },
      ],
    });
  }

  toCourseProgressResponseDto(
    courseId: number,
    progressStats: ProgressStats,
    lessons: LessonProgressWithLesson[],
  ): CourseProgressResponseDto {
    return {
      courseId,
      progressStats,
      lessons: lessons.map((lp) => ({
        id: lp.id,
        isCompleted: lp.isCompleted,
        completedAt: lp.completedAt,
        lesson: {
          id: lp.lesson.id,
          title: lp.lesson.title,
          orderIndex: lp.lesson.orderIndex,
          sectionId: lp.lesson.sectionId,
        },
      })),
    };
  }

  async getLessonWithNavigation(
    lessonId: number,
    studentId: number,
  ): Promise<LessonWithNavigation | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { studentId },
                  select: { id: true },
                },
              },
            },
            lessons: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
              select: { id: true, title: true, orderIndex: true },
            },
          },
        },
        lessonProgress: {
          where: { studentId },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    const isEnrolled = lesson.section.course.enrollments.length > 0;
    if (!isEnrolled) {
      return null;
    }

    const currentIndex = lesson.section.lessons.findIndex(
      (l) => l.id === lesson.id,
    );

    const { lessons } = lesson.section;

    let previousLesson: SimpleLesson | null = null;
    if (currentIndex > 0) {
      previousLesson = lessons[currentIndex - 1];
    } else {
      previousLesson = await this.getLastLessonOfPreviousSection(
        lesson.sectionId,
        lesson.section.courseId,
      );
    }

    let nextLesson: SimpleLesson | null = null;
    if (currentIndex < lessons.length - 1) {
      nextLesson = lessons[currentIndex + 1];
    } else {
      nextLesson = await this.getFirstLessonOfNextSection(
        lesson.sectionId,
        lesson.section.courseId,
      );
    }

    return {
      ...lesson,
      navigation: {
        previousLesson,
        nextLesson,
      },
    };
  }

  private async getLastLessonOfPreviousSection(
    currentSectionId: number,
    courseId: number,
  ): Promise<SimpleLesson | null> {
    const currentSection = await this.prisma.courseSection.findUnique({
      where: { id: currentSectionId },
      select: { orderIndex: true },
    });

    if (!currentSection) {
      return null;
    }

    const previousSection = await this.prisma.courseSection.findFirst({
      where: {
        courseId,
        orderIndex: { lt: currentSection.orderIndex },
      },
      orderBy: { orderIndex: 'desc' },
      include: {
        lessons: {
          where: { isActive: true },
          orderBy: { orderIndex: 'desc' },
          select: { id: true, title: true, orderIndex: true },
        },
      },
    });

    return previousSection?.lessons[0] || null;
  }

  private async getFirstLessonOfNextSection(
    currentSectionId: number,
    courseId: number,
  ): Promise<SimpleLesson | null> {
    const currentSection = await this.prisma.courseSection.findUnique({
      where: { id: currentSectionId },
      select: { orderIndex: true },
    });

    if (!currentSection) {
      return null;
    }

    const nextSection = await this.prisma.courseSection.findFirst({
      where: {
        courseId,
        orderIndex: { gt: currentSection.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, orderIndex: true },
        },
      },
    });

    return nextSection?.lessons[0] || null;
  }

  toLessonDetailResponseDto(
    lesson: LessonWithNavigation,
  ): LessonDetailResponseDto {
    return {
      id: lesson.id,
      title: lesson.title,
      contentType: lesson.contentType,
      contentUrl:
        this.formatVideoUrl(lesson.contentUrl, lesson.contentType) || null,
      contentText: lesson.contentText || null,
      durationMinutes: lesson.durationMinutes,
      orderIndex: lesson.orderIndex,
      isActive: lesson.isActive,
      section: {
        id: lesson.section.id,
        title: lesson.section.title,
        courseId: lesson.section.course.id,
      },
      progress: this.mapLessonProgress(lesson.lessonProgress),
      navigation: lesson.navigation,
    };
  }

  async markAsCompleted(
    studentId: number,
    lessonId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<LessonProgress | null> {
    const prisma = tx ?? this.prisma;

    return prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: { isCompleted: true, completedAt: new Date() },
      create: {
        studentId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  async updateEnrollmentProgress(
    studentId: number,
    courseId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;

    const progressStats = await this.calculateProgressStats(
      studentId,
      courseId,
    );

    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        progressPercentage: progressStats.percentage,
        ...(progressStats.percentage === 100 && {
          completedAt: new Date(),
          status: EnrollmentStatus.COMPLETED,
        }),
      },
    });
  }

  async getNextLesson(lessonId: number): Promise<SimpleLesson | null> {
    const lessonWithSiblings = await this.getLessonWithSiblings(lessonId);
    if (!lessonWithSiblings) {
      return null;
    }

    const { lessons, currentIndex, lesson } = lessonWithSiblings;

    if (currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1];
    }

    const nextSectionLesson = await this.getFirstLessonOfNextSection(
      lesson.sectionId,
      lesson.section.courseId,
    );

    return nextSectionLesson;
  }

  private async getLessonWithSiblings(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
              select: { id: true, title: true, orderIndex: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    const currentIndex = lesson.section.lessons.findIndex(
      (l) => l.id === lessonId,
    );

    return {
      lessons: lesson.section.lessons,
      currentIndex,
      lesson,
    };
  }

  toLessonCompleteResponseDto(
    currentLesson: SimpleLesson,
    nextLesson: SimpleLesson | null,
    courseProgress: ProgressStats,
  ): LessonCompleteResponseDto {
    return {
      currentLesson: {
        ...currentLesson,
        isCompleted: true,
      },
      nextLesson,
      courseProgress,
    };
  }
}
