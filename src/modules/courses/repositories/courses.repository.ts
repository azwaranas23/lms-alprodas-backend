import { Injectable } from '@nestjs/common';
import {
  CourseWithRelations,
  EnrollmentWithCourse,
} from '../types/course.types';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QueryCourseDto } from '../dto/query-course.dto';
import { Course, CourseResource, CourseStatus, Prisma } from '@prisma/client';
import { CourseResponseDto } from '../dto/course-response.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseResourceResponseDto } from '../dto/course-resource/course-resource-response.dto';
import { UpdateCourseResourceData } from '../types/course-resource.types';
import { MyCourseResponseDto } from '../dto/my-course-response.dto';

interface PaginatedCoursesResponse {
  courses: CourseWithRelations[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) { }

  // FIXED: Prisma SortOrder enum digunakan
  private readonly includeCourseRelations = {
    subject: { include: { topic: true } },

    mentor: { include: { userProfile: true } },

    courseImages: {
      orderBy: { orderIndex: Prisma.SortOrder.asc },
    },

    courseKeyPoints: {
      orderBy: { createdAt: Prisma.SortOrder.asc },
    },

    coursePersonas: {
      orderBy: { id: Prisma.SortOrder.asc },
    },

    courseResources: {
      orderBy: { createdAt: Prisma.SortOrder.asc },
    },

    courseSections: {
      include: {
        lessons: {
          orderBy: { orderIndex: Prisma.SortOrder.asc },
        },
      },
      orderBy: { orderIndex: Prisma.SortOrder.asc },
    },

    courseReviews: {
      include: {
        student: {
          select: {
            id: true,
            name: true,
            userProfile: { select: { avatar: true } },
          },
        },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    },
  };

  async findMany(
    query: QueryCourseDto,
    user?: { id: number; role: { key: string } },
  ): Promise<PaginatedCoursesResponse> {
    const { page = 1, limit = 10, search, status, subjectId, topicId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(search && {
        title: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
      ...(status && { status }),
      ...(subjectId && { subjectId }),
      ...(topicId && { subject: { topicId } }),
      ...(user?.role.key === 'mentor' && { mentorId: user.id }),
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: this.includeCourseRelations,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { courses: courses as CourseWithRelations[], total, page, limit };
  }

  async findById(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<CourseWithRelations | null> {
    return (await this.prisma.course.findUnique({
      where: { id },
      include: this.includeCourseRelations,
    })) as CourseWithRelations | null;
  }

  async create(
    data: CreateCourseDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Course> {
    const prisma = tx ?? this.prisma;

    return prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        about: data.about,
        tools: data.tools,
        status: data.status,
        subjectId: data.subject_id,
        mentorId: data.mentor_id,
        courseToken: data.course_token ?? null,
      },
    });
  }

  async update(
    id: number,
    data: UpdateCourseDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Course> {
    const prisma = tx ?? this.prisma;

    return prisma.course.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        about: data.about,
        tools: data.tools,
        status: data.status,
        courseToken: data.course_token ?? null,
      },
    });
  }

  async delete(id: number, tx?: Prisma.TransactionClient): Promise<Course> {
    const prisma = tx ?? this.prisma;
    return prisma.course.delete({ where: { id } });
  }

  /** ---------------- IMAGES ---------------- */

  async createCourseImages(
    courseId: number,
    images: {
      main?: string;
      preview?: string;
      sample?: string;
      certificate?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const data: { courseId: number; imagePath: string; orderIndex: number }[] =
      [];

    if (images.main)
      data.push({ courseId, imagePath: images.main, orderIndex: 1 });
    if (images.preview)
      data.push({ courseId, imagePath: images.preview, orderIndex: 2 });
    if (images.sample)
      data.push({ courseId, imagePath: images.sample, orderIndex: 3 });
    if (images.certificate)
      data.push({ courseId, imagePath: images.certificate, orderIndex: 4 });

    if (data.length > 0) {
      await prisma.courseImage.createMany({ data });
    }
  }

  async updateCourseImage(
    courseId: number,
    orderIndex: number,
    imagePath: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const existing = await prisma.courseImage.findFirst({
      where: { courseId, orderIndex },
    });

    if (existing) {
      await prisma.courseImage.update({
        where: { id: existing.id },
        data: { imagePath },
      });
    } else {
      await prisma.courseImage.create({
        data: { courseId, imagePath, orderIndex },
      });
    }
  }

  async deleteCourseImages(courseId: number, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await prisma.courseImage.deleteMany({ where: { courseId } });
  }

  /** ---------------- KEYPOINTS ---------------- */

  async createCourseKeyPoints(
    courseId: number,
    keyPoints: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    await prisma.courseKeyPoint.createMany({
      data: keyPoints.map((k) => ({ courseId, keyPoint: k })),
    });
  }

  async deleteCourseKeyPoints(courseId: number, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await prisma.courseKeyPoint.deleteMany({ where: { courseId } });
  }

  /** ---------------- PERSONAS ---------------- */

  async createCoursePersonas(
    courseId: number,
    personas: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    await prisma.coursePersona.createMany({
      data: personas.map((p) => ({ courseId, persona: p })),
    });
  }

  async deleteCoursePersonas(courseId: number, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await prisma.coursePersona.deleteMany({ where: { courseId } });
  }

  /** ---------------- RESOURCES ---------------- */

  async createCourseResource(
    courseId: number,
    data: {
      resourceType: string;
      resourcePath: string;
      fileName: string;
      fileSize: number;
    },
  ) {
    return this.prisma.courseResource.create({
      data: { courseId, ...data },
    });
  }

  async findCourseResourceById(id: number) {
    return this.prisma.courseResource.findUnique({ where: { id } });
  }

  async updateCourseResource(id: number, data: UpdateCourseResourceData) {
    return this.prisma.courseResource.update({
      where: { id },
      data,
    });
  }

  async deleteCourseResource(id: number) {
    return this.prisma.courseResource.delete({ where: { id } });
  }

  toResourceResponseDto(res: CourseResource): CourseResourceResponseDto {
    return {
      id: res.id,
      courseId: res.courseId,
      resourceType: res.resourceType,
      resourcePath: res.resourcePath,
      fileName: res.fileName,
      fileSize: res.fileSize,
    };
  }

  /** ---------------- MOST JOINED ---------------- */

  async findMostJoined(limit = 3): Promise<CourseWithRelations[]> {
    return (await this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      take: limit,
      orderBy: { totalStudents: Prisma.SortOrder.desc },
      include: this.includeCourseRelations,
    })) as CourseWithRelations[];
  }

  /** ---------------- UPDATE STUDENTS ---------------- */

  async updateCourseStudentCount(
    courseId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const count = await prisma.enrollment.count({ where: { courseId } });

    await prisma.course.update({
      where: { id: courseId },
      data: { totalStudents: count },
    });
  }

  /** ---------------- ENROLLED COURSES ---------------- */

  async findEnrolledCourses(studentId: number, query: QueryCourseDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      studentId,
      ...(search && {
        course: {
          title: { contains: search, mode: Prisma.QueryMode.insensitive },
        },
      }),
    };

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: {
          course: {
            include: {
              mentor: { include: { userProfile: true } },
              subject: { include: { topic: true } },
              courseImages: { orderBy: { orderIndex: Prisma.SortOrder.asc } },
            },
          },
        },
        orderBy: { enrolledAt: Prisma.SortOrder.desc },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      courses: this.toMyCourseResponseDtos(
        enrollments as EnrollmentWithCourse[],
      ),
      total,
      page,
      limit,
    };
  }

  async updateSubjectCourseCount(
    subjectId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;
    const count = await prisma.course.count({ where: { subjectId } });

    await prisma.subject.update({
      where: { id: subjectId },
      data: { totalCourses: count },
    });
  }

  /** ---------------- MENTOR STUDENTS ---------------- */

  async findMentorStudents(
    mentorId: number,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Get all courses by this mentor
    const mentorCourses = await this.prisma.course.findMany({
      where: { mentorId },
      select: { id: true },
    });

    const courseIds = mentorCourses.map((c) => c.id);

    if (courseIds.length === 0) {
      return { students: [], total: 0, page, limit };
    }

    const where = {
      courseId: { in: courseIds },
      ...(search && {
        student: {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      }),
    };

    // Get unique students enrolled in mentor's courses
    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        distinct: ['studentId'],
        include: {
          student: {
            include: {
              userProfile: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { enrolledAt: Prisma.SortOrder.desc },
      }),
      this.prisma.enrollment.groupBy({
        by: ['studentId'],
        where,
      }).then((result) => result.length),
    ]);

    // Transform to student list with enrolled courses count
    const studentMap = new Map<number, any>();

    for (const enrollment of enrollments) {
      if (!studentMap.has(enrollment.studentId)) {
        // Count all courses from this mentor that the student is enrolled in
        const enrolledCoursesCount = await this.prisma.enrollment.count({
          where: {
            studentId: enrollment.studentId,
            courseId: { in: courseIds },
          },
        });

        studentMap.set(enrollment.studentId, {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          is_active: enrollment.student.isActive,
          enrolled_courses_count: enrolledCoursesCount,
          user_profile: enrollment.student.userProfile
            ? {
              avatar: enrollment.student.userProfile.avatar,
            }
            : null,
          latest_enrollment: enrollment.enrolledAt,
        });
      }
    }

    return {
      students: Array.from(studentMap.values()),
      total,
      page,
      limit,
    };
  }

  /** ---------------- TOKEN ---------------- */

  async findByCourseToken(token: string) {
    return this.prisma.course.findFirst({ where: { courseToken: token } });
  }

  /** ---------------- DTO MAPPING ---------------- */

  toResponseDto(course: CourseWithRelations): CourseResponseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      about: course.about,
      tools: course.tools,
      courseToken: course.courseToken,
      status: course.status,
      totalLessons: course.totalLessons,
      totalStudents: course.totalStudents,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,

      subject: {
        id: course.subject.id,
        name: course.subject.name,
        topic: {
          id: course.subject.topic.id,
          name: course.subject.topic.name,
        },
      },

      mentor: {
        id: course.mentor.id,
        email: course.mentor.email,
        name: course.mentor.name,
        profile: course.mentor.userProfile
          ? {
            bio: course.mentor.userProfile.bio,
            avatar: course.mentor.userProfile.avatar,
          }
          : null,
      },

      images: course.courseImages.map((img) => ({
        id: img.id,
        imagePath: img.imagePath,
        orderIndex: img.orderIndex ?? 0,
      })),

      keyPoints: course.courseKeyPoints.map((kp) => ({
        id: kp.id,
        keyPoint: kp.keyPoint,
      })),

      personas: course.coursePersonas.map((p) => ({
        id: p.id,
        persona: p.persona,
      })),

      resources: course.courseResources.map((r) =>
        this.toResourceResponseDto(r),
      ),

      sections: course.courseSections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        description: sec.description,
        orderIndex: sec.orderIndex,
        totalLessons: sec.totalLessons,
        lessons: sec.lessons.map((ls) => ({
          id: ls.id,
          title: ls.title,
          contentType: ls.contentType,
          contentUrl: ls.contentUrl,
          contentText: ls.contentText,
          durationMinutes: ls.durationMinutes,
          orderIndex: ls.orderIndex,
          isActive: ls.isActive,
        })),
      })),

      reviews: course.courseReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        reviewText: r.reviewText,
        createdAt: r.createdAt,
        student: {
          id: r.student.id,
          name: r.student.name,
          profile: {
            avatar: r.student.userProfile?.avatar || null,
          },
        },
      })),
    };
  }

  toResponseDtos(courses: CourseWithRelations[]): CourseResponseDto[] {
    return courses.map((c) => this.toResponseDto(c));
  }

  toMyCourseResponseDto(enrollment: EnrollmentWithCourse): MyCourseResponseDto {
    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      status: enrollment.course.status,
      totalLessons: enrollment.course.totalLessons,
      progressPercentage: Number(enrollment.progressPercentage),
      enrolledAt: enrollment.enrolledAt,
      certificateId: enrollment.certificateId,
      image: enrollment.course.courseImages[0]?.imagePath || null,

      mentor: {
        id: enrollment.course.mentor.id,
        name: enrollment.course.mentor.name,
        avatar: enrollment.course.mentor.userProfile?.avatar || null,
      },

      subject: {
        id: enrollment.course.subject.id,
        name: enrollment.course.subject.name,
        topic: {
          id: enrollment.course.subject.topic.id,
          name: enrollment.course.subject.topic.name,
        },
      },
    };
  }

  toMyCourseResponseDtos(
    enrollments: EnrollmentWithCourse[],
  ): MyCourseResponseDto[] {
    return enrollments.map((en) => this.toMyCourseResponseDto(en));
  }
}
