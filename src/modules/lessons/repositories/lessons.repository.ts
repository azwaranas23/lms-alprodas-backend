import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { LessonWithSection } from '../types/lesson.types';
import { LessonResponseDto } from '../dto/lesson-response.dto';
import { YOUTUBE_CONSTANTS } from 'src/common/constants/app.constants';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { ContentType, Lesson, Prisma } from '@prisma/client';
import { UpdateLessonDto } from '../dto/update-lesson.dto';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<LessonWithSection[]> {
    return this.prisma.lesson.findMany({
      include: {
        section: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async findBySectionId(sectionId: number): Promise<LessonWithSection[]> {
    return this.prisma.lesson.findMany({
      where: { sectionId },
      include: {
        section: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async findById(id: number): Promise<LessonWithSection | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });
  }

  async findByIdWithSection(id: number): Promise<LessonWithSection | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });
  }

  async findByIdWithSectionAndCourse(
    id: number,
  ): Promise<LessonWithSection | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async create(data: CreateLessonDto): Promise<Lesson> {
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          title: data.title,
          sectionId: data.section_id,
          contentType: data.content_type,
          contentUrl: data.content_url,
          contentText: data.content_text,
          durationMinutes: data.duration_minutes,
          orderIndex: data.order_index,
          isActive: data.is_active,
        },
      });

      await this.updateCourseLessonCount(data.section_id, tx);

      return lesson;
    });
  }

  async update(id: number, data: UpdateLessonDto): Promise<Lesson> {
    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.LessonUpdateInput = {};

      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      if (data.content_type !== undefined) {
        updateData.contentType = data.content_type;

        if (data.content_type === ContentType.VIDEO) {
          updateData.contentText = null;
        } else if (data.content_type === ContentType.ARTICLE) {
          updateData.contentUrl = null;
        }
      }

      if (data.content_url !== undefined) {
        updateData.contentUrl = data.content_url;
      }

      if (data.content_text !== undefined) {
        updateData.contentText = data.content_text;
      }

      if (data.duration_minutes !== undefined) {
        updateData.durationMinutes = data.duration_minutes;
      }

      if (data.order_index !== undefined) {
        updateData.orderIndex = data.order_index;
      }

      if (data.is_active !== undefined) {
        updateData.isActive = data.is_active;
      }

      const updatedLesson = await tx.lesson.update({
        where: { id },
        data: updateData,
      });

      return updatedLesson;
    });
  }

  async delete(id: number, sectionId: number): Promise<Lesson> {
    return this.prisma.$transaction(async (tx) => {
      const deletedLesson = await tx.lesson.delete({
        where: { id },
      });

      await this.updateCourseLessonCount(sectionId, tx);

      return deletedLesson;
    });
  }

  toResponseDto(lesson: LessonWithSection): LessonResponseDto {
    return {
      id: lesson.id,
      sectionId: lesson.sectionId,
      title: lesson.title,
      contentType: lesson.contentType,
      contentUrl: this.formatVideoUrl(lesson.contentUrl, lesson.contentType),
      contentText: lesson.contentText ?? null,
      durationMinutes: lesson.durationMinutes,
      orderIndex: lesson.orderIndex,
      isActive: lesson.isActive,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  toResponseDtos(lessons: LessonWithSection[]): LessonResponseDto[] {
    return lessons.map((lesson) => this.toResponseDto(lesson));
  }

  private formatVideoUrl(
    url: string | null,
    contentType: string,
  ): string | null {
    if (!url || contentType !== 'VIDEO') {
      return url;
    }

    return `${YOUTUBE_CONSTANTS.EMBED_BASE_URL}${url}`;
  }

  private async updateCourseLessonCount(
    sectionId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const section = await tx.courseSection.findUnique({
      where: { id: sectionId },
      select: { courseId: true },
    });

    if (!section) {
      return;
    }

    const totalLessons = await tx.lesson.count({
      where: {
        section: {
          courseId: section.courseId,
        },
      },
    });

    await tx.course.update({
      where: { id: section.courseId },
      data: { totalLessons },
    });
  }
}
