import { Injectable } from '@nestjs/common';
import { CourseSection, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SectionWithCourse } from '../types/section.types';
import { SectionResponseDto } from '../dto/section-response.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';

@Injectable()
export class SectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<SectionWithCourse[]> {
    return this.prisma.courseSection.findMany({
      include: {
        course: true,
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findByCourseId(courseId: number): Promise<SectionWithCourse[]> {
    return this.prisma.courseSection.findMany({
      where: { courseId },
      include: {
        course: true,
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findByIdWithCourse(id: number): Promise<SectionWithCourse | null> {
    return this.prisma.courseSection.findUnique({
      where: { id },
      include: {
        course: true,
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async create(data: CreateSectionDto): Promise<CourseSection> {
    return this.prisma.courseSection.create({
      data: {
        title: data.title,
        description: data.description,
        courseId: data.course_id,
        orderIndex: data.order_index,
      },
    });
  }

  async update(id: number, data: UpdateSectionDto): Promise<CourseSection> {
    const updateData: Prisma.CourseSectionUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.order_index !== undefined) {
      updateData.orderIndex = data.order_index;
    }

    return this.prisma.courseSection.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<CourseSection> {
    return this.prisma.courseSection.delete({ where: { id } });
  }

  toResponseDto(section: SectionWithCourse): SectionResponseDto {
    return {
      id: section.id,
      title: section.title,
      description: section.description || null,
      courseId: section.courseId,
      course: {
        id: section.course.id,
        title: section.course.title,
        description: section.course.description || null,
      },
      orderIndex: section.orderIndex,
      totalLessons: section.lessons?.length || 0,
      lessons:
        section.lessons?.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.contentType,
          contentUrl: lesson.contentUrl || null,
          durationMinutes: lesson.durationMinutes,
          orderIndex: lesson.orderIndex,
          isActive: lesson.isActive,
        })) || [],
    };
  }

  toResponseDtos(sections: SectionWithCourse[]): SectionResponseDto[] {
    return sections.map((section) => this.toResponseDto(section));
  }
}
