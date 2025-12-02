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
import { UpdateCourseResourceDto } from '../dto/course-resource/update-course-resource.dto';
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
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeCourseRelations = {
    subject: {
      include: {
        topic: true,
      },
    },
    mentor: {
      include: {
        userProfile: true,
      },
    },
    courseImages: {
      orderBy: {
        orderIndex: Prisma.SortOrder.asc,
      },
    },
    courseKeyPoints: {
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
    },
    coursePersonas: {
      orderBy: {
        id: Prisma.SortOrder.asc,
      },
    },
    courseResources: {
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
    },
    courseSections: {
      include: {
        lessons: {
          orderBy: {
            orderIndex: Prisma.SortOrder.asc,
          },
        },
      },
      orderBy: {
        orderIndex: Prisma.SortOrder.asc,
      },
    },
    courseReviews: {
      include: {
        student: {
          select: {
            id: true,
            name: true,
            userProfile: {
              select: {
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
    },
  };

  async findMany(
    query: QueryCourseDto,
    user?: { id: number; role: { key: string } },
  ): Promise<PaginatedCoursesResponse> {
    const { page = 1, limit = 10, search, status, subjectId, topicId } = query;
    const skip = (page - 1) * limit;

    const where = {
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      courses: courses as unknown as CourseWithRelations[],
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<CourseWithRelations | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: this.includeCourseRelations,
    }) as unknown as CourseWithRelations | null;
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
        price: data.price,
        status: data.status,
        subjectId: data.subject_id,
        mentorId: data.mentor_id,
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
        price: data.price,
        status: data.status,
        ...(data.subject_id && { subjectId: data.subject_id }),
      },
    });
  }

  async delete(id: number, tx?: Prisma.TransactionClient): Promise<Course> {
    const prisma = tx ?? this.prisma;
    return prisma.course.delete({
      where: { id },
    });
  }

  async createCourseImages(
    courseId: number,
    images: {
      main?: string;
      preview?: string;
      sample?: string;
      certificate?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    const imageData: {
      courseId: number;
      imagePath: string;
      orderIndex: number;
    }[] = [];

    if (images.main) {
      imageData.push({
        courseId,
        imagePath: images.main,
        orderIndex: 1,
      });
    }

    if (images.preview) {
      imageData.push({
        courseId,
        imagePath: images.preview,
        orderIndex: 2,
      });
    }

    if (images.sample) {
      imageData.push({
        courseId,
        imagePath: images.sample,
        orderIndex: 3,
      });
    }

    if (images.certificate) {
      imageData.push({
        courseId,
        imagePath: images.certificate,
        orderIndex: 4,
      });
    }

    if (imageData.length > 0) {
      await prisma.courseImage.createMany({
        data: imageData,
      });
    }
  }

  async updateCourseImage(
    courseId: number,
    orderIndex: number,
    imagePath: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    const existingImage = await prisma.courseImage.findFirst({
      where: {
        courseId,
        orderIndex,
      },
    });

    if (existingImage) {
      await prisma.courseImage.update({
        where: { id: existingImage.id },
        data: { imagePath },
      });
    } else {
      await prisma.courseImage.create({
        data: {
          courseId,
          imagePath,
          orderIndex,
        },
      });
    }
  }

  async deleteCourseImages(
    courseId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.courseImage.deleteMany({
      where: { courseId },
    });
  }

  async updateSubjectCourseCount(
    subjectId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    const courseCount = await prisma.course.count({
      where: { subjectId },
    });

    await prisma.subject.update({
      where: { id: subjectId },
      data: { totalCourses: courseCount },
    });
  }

  async createCourseKeyPoints(
    courseId: number,
    keyPoints: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    const keyPointData = keyPoints.map((keyPoint) => ({
      courseId,
      keyPoint,
    }));

    if (keyPointData.length > 0) {
      await prisma.courseKeyPoint.createMany({
        data: keyPointData,
      });
    }
  }

  async deleteCourseKeyPoints(
    courseId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.courseKeyPoint.deleteMany({
      where: { courseId },
    });
  }

  async createCoursePersonas(
    courseId: number,
    personas: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    const personaData = personas.map((persona) => ({
      courseId,
      persona,
    }));

    if (personaData.length > 0) {
      await prisma.coursePersona.createMany({
        data: personaData,
      });
    }
  }

  async deleteCoursePersonas(
    courseId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.coursePersona.deleteMany({
      where: { courseId },
    });
  }

  toResponseDto(course: CourseWithRelations): CourseResponseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description || null,
      about: course.about || null,
      tools: course.tools || null,
      price: Number(course.price),
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
              bio: course.mentor.userProfile.bio || null,
              avatar: course.mentor.userProfile.avatar || null,
              expertise: course.mentor.userProfile.expertise || null,
            }
          : null,
      },
      images: course.courseImages.map((image) => ({
        id: image.id,
        imagePath: image.imagePath || null,
        orderIndex: image.orderIndex || 0,
      })),
      keyPoints: course.courseKeyPoints.map((keyPoint) => ({
        id: keyPoint.id,
        keyPoint: keyPoint.keyPoint,
      })),
      personas: course.coursePersonas.map((persona) => ({
        id: persona.id,
        persona: persona.persona,
      })),
      resources: course.courseResources.map((resource) => ({
        id: resource.id,
        resourceType: resource.resourceType,
        resourcePath: resource.resourcePath,
        fileName: resource.fileName,
        fileSize: resource.fileSize,
      })),
      sections: course.courseSections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description || null,
        orderIndex: section.orderIndex,
        totalLessons: section.totalLessons,
        lessons: section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.contentType,
          contentUrl: lesson.contentUrl || null,
          contentText: lesson.contentText || null,
          durationMinutes: lesson.durationMinutes,
          orderIndex: lesson.orderIndex,
          isActive: lesson.isActive,
        })),
      })),
      reviews: course.courseReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        reviewText: review.reviewText || null,
        createdAt: review.createdAt,
        student: {
          id: review.student.id,
          name: review.student.name,
          profile: review.student.userProfile
            ? {
                avatar: review.student.userProfile.avatar || null,
              }
            : null,
        },
      })),
    };
  }

  toResponseDtos(courses: CourseWithRelations[]): CourseResponseDto[] {
    return courses.map((course) => this.toResponseDto(course));
  }

  toResourceResponseDto(resource: CourseResource): CourseResourceResponseDto {
    return {
      id: resource.id,
      courseId: resource.courseId,
      resourceType: resource.resourceType,
      resourcePath: resource.resourcePath,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
    };
  }

  async createCourseResource(
    courseId: number,
    resourceData: {
      resourceType: string;
      resourcePath: string;
      fileName: string;
      fileSize: number;
    },
  ): Promise<CourseResource> {
    return this.prisma.courseResource.create({
      data: {
        courseId,
        resourceType: resourceData.resourceType,
        resourcePath: resourceData.resourcePath,
        fileName: resourceData.fileName,
        fileSize: resourceData.fileSize,
      },
    });
  }

  async findCourseResourceById(id: number): Promise<CourseResource | null> {
    return this.prisma.courseResource.findUnique({
      where: { id },
    });
  }

  async updateCourseResource(
    id: number,
    data: UpdateCourseResourceData,
  ): Promise<CourseResource> {
    return this.prisma.courseResource.update({
      where: { id },
      data,
    });
  }

  async deleteCourseResource(id: number): Promise<CourseResource> {
    return this.prisma.courseResource.delete({
      where: { id },
    });
  }

  async findMostJoined(limit: number = 3): Promise<CourseWithRelations[]> {
    return this.prisma.course.findMany({
      take: limit,
      where: {
        status: CourseStatus.PUBLISHED,
      },
      orderBy: {
        totalStudents: 'desc',
      },
      include: this.includeCourseRelations,
    }) as unknown as CourseWithRelations[];
  }

  async updateCourseStudentCount(
    courseId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx || this.prisma;

    const studentCount = await prisma.enrollment.count({
      where: { courseId },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: { totalStudents: studentCount },
    });
  }

  async findEnrolledCourses(
    studentId: number,
    query: QueryCourseDto,
  ): Promise<{
    courses: MyCourseResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
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
              mentor: {
                include: {
                  userProfile: true,
                },
              },
              subject: {
                include: {
                  topic: true,
                },
              },
              courseImages: {
                orderBy: {
                  orderIndex: Prisma.SortOrder.asc,
                },
              },
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const courses = this.toMyCourseResponseDtos(enrollments);

    return {
      courses,
      total,
      page,
      limit,
    };
  }

  toMyCourseResponseDto(enrollment: EnrollmentWithCourse): MyCourseResponseDto {
    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      price: Number(enrollment.course.price),
      status: enrollment.course.status,
      totalLessons: enrollment.course.totalLessons,
      progressPercentage: Number(enrollment.progressPercentage),
      enrolledAt: enrollment.enrolledAt,
      certificateId: enrollment.certificateId,
      image:
        enrollment.course.courseImages.length > 0
          ? enrollment.course.courseImages[0].imagePath
          : null,
      mentor: {
        id: enrollment.course.mentor.id,
        name: enrollment.course.mentor.name,
        avatar: enrollment.course.mentor.userProfile?.avatar || null,
        expertise: enrollment.course.mentor.userProfile?.expertise || null,
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
    return enrollments.map((enrollment) =>
      this.toMyCourseResponseDto(enrollment),
    );
  }
}
