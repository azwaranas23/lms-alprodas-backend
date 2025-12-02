import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubjectWithTopic } from '../types/subject.types';
import { PaginationQuery } from 'src/common/interface/pagination.interface';
import { Prisma, Subject } from '@prisma/client';
import { SubjectsResponseDto } from '../dto/subjects-response.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

interface PaginatedSubjectsResponse {
  subjects: SubjectWithTopic[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SubjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: PaginationQuery & { topicId?: number },
  ): Promise<PaginatedSubjectsResponse> {
    const { page = 1, limit = 10, search, topicId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SubjectWhereInput = {
      ...(search && {
        name: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
      ...(topicId && { topicId }),
    };

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        include: {
          topic: true,
          courses: {
            select: {
              totalStudents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subject.count({ where }),
    ]);

    const subjectsWithStudentCount = subjects.map((subject) => ({
      ...subject,
      totalStudents: subject.courses.reduce(
        (sum, course) => sum + (course.totalStudents || 0),
        0,
      ),
    }));

    return {
      subjects: subjectsWithStudentCount,
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<Subject | null> {
    return this.prisma.subject.findUnique({ where: { id } });
  }

  async findByIdWithTopic(id: number): Promise<SubjectWithTopic | null> {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { topic: true },
    });
  }

  async create(data: CreateSubjectDto): Promise<Subject> {
    return this.prisma.subject.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        topicId: data.topic_id,
      },
    });
  }

  async update(id: number, data: UpdateSubjectDto): Promise<Subject> {
    const updateData: Partial<{
      name: string;
      description: string | null;
      image: string | null;
      topicId: number;
    }> = {
      name: data.name,
      description: data.description,
      image: data.image,
      topicId: data.topic_id,
    };

    if (data.topic_id !== undefined) {
      updateData.topicId = data.topic_id;
    }

    return this.prisma.subject.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<Subject> {
    return this.prisma.subject.delete({ where: { id } });
  }

  toResponseDto(subject: SubjectWithTopic): SubjectsResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      description: subject.description || null,
      image: subject.image || null,
      topicId: subject.topicId,
      topic: {
        id: subject.topic.id,
        name: subject.topic.name,
        description: subject.topic.description || null,
        image: subject.topic.image || null,
      },
      totalCourses: subject.totalCourses || 0,
      totalStudents: subject.totalStudents || 0,
    };
  }

  toResponseDtos(subjects: SubjectWithTopic[]): SubjectsResponseDto[] {
    return subjects.map((subject) => this.toResponseDto(subject));
  }
}
