import { Injectable } from '@nestjs/common';
import { TopicWithCourseCount } from '../interfaces/topic.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PaginationQuery } from 'src/common/interface/pagination.interface';
import { Prisma, Topic } from '@prisma/client';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';

interface PaginatedTopicsResponse {
  topics: TopicWithCourseCount[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class TopicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: PaginationQuery): Promise<PaginatedTopicsResponse> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TopicWhereInput = search
      ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
      : {};

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.topic.count({ where }),
    ]);

    const topicIds = topics.map((topic) => topic.id);

    const subjects = await this.prisma.subject.findMany({
      where: { topicId: { in: topicIds } },
      select: { id: true, topicId: true },
    });

    const subjectToTopicMap: Record<number, number> = {};
    subjects.forEach((subject) => {
      subjectToTopicMap[subject.id] = subject.topicId;
    });

    const subjectIds = subjects.map((subject) => subject.id);

    const courseCounts =
      subjectIds.length > 0
        ? await this.prisma.course.groupBy({
            by: ['subjectId'],
            _count: { _all: true },
            where: { subjectId: { in: subjectIds } },
          })
        : [];

    const topicCourseCountMap: Record<number, number> = {};
    courseCounts.forEach((group) => {
      const topicId = subjectToTopicMap[group.subjectId];
      if (topicId != undefined) {
        topicCourseCountMap[topicId] =
          (topicCourseCountMap[topicId] || 0) + group._count._all;
      }
    });

    const topicSubjectCountMap: Record<number, number> = {};
    subjects.forEach((subject) => {
      topicSubjectCountMap[subject.topicId] =
        (topicSubjectCountMap[subject.topicId] || 0) + 1;
    });

    const enrollmentCounts =
      subjectIds.length > 0
        ? await this.prisma.enrollment.groupBy({
            by: ['courseId'],
            _count: { _all: true },
            where: { course: { subjectId: { in: subjectIds } } },
          })
        : [];

    const courseIds = enrollmentCounts.map((ec) => ec.courseId);

    const courses =
      courseIds.length > 0
        ? await this.prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, subjectId: true },
          })
        : [];

    const courseToTopicMap: Record<number, number> = {};
    courses.forEach((course) => {
      const topicId = subjectToTopicMap[course.subjectId];
      if (topicId != undefined) {
        courseToTopicMap[course.id] = topicId;
      }
    });

    const topicEnrollmentCountMap: Record<number, number> = {};
    enrollmentCounts.forEach((group) => {
      const topicId = courseToTopicMap[group.courseId];
      if (topicId != undefined) {
        topicEnrollmentCountMap[topicId] =
          (topicEnrollmentCountMap[topicId] || 0) + group._count._all;
      }
    });

    const topicsWithCourseCount = topics.map((topic) => ({
      ...topic,
      courseCount: topicCourseCountMap[topic.id] || 0,
      subjectCount: topicSubjectCountMap[topic.id] || 0,
      studentEnrollmentCount: topicEnrollmentCountMap[topic.id] || 0,
    }));

    return {
      topics: topicsWithCourseCount,
      total,
      page,
      limit,
    };
  }

  async findByIdWithCourseCount(
    id: number,
  ): Promise<TopicWithCourseCount | null> {
    const [topic, courseCount, subjectCount, enrollmentCount] =
      await Promise.all([
        this.prisma.topic.findUnique({ where: { id } }),
        this.prisma.course.count({
          where: { subject: { topicId: id } },
        }),
        this.prisma.subject.count({
          where: { topicId: id },
        }),
        this.prisma.enrollment.count({
          where: { course: { subject: { topicId: id } } },
        }),
      ]);

    if (!topic) {
      return null;
    }

    return {
      ...topic,
      courseCount,
      subjectCount,
      studentEnrollmentCount: enrollmentCount,
    };
  }

  async findById(id: number): Promise<Topic | null> {
    return this.prisma.topic.findUnique({ where: { id } });
  }

  async create(data: CreateTopicDto): Promise<Topic> {
    return this.prisma.topic.create({
      data,
    });
  }

  async update(id: number, data: UpdateTopicDto): Promise<Topic> {
    return this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Topic> {
    return this.prisma.topic.delete({
      where: { id },
    });
  }

  toResponseDto(topic: TopicWithCourseCount) {
    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      image: topic.image,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      courseCount: topic.courseCount,
      subjectCount: topic.subjectCount,
      studentEnrollmentCount: topic.studentEnrollmentCount,
    };
  }

  toResponseDtos(topics: TopicWithCourseCount[]) {
    return topics.map((topic) => this.toResponseDto(topic));
  }
}
