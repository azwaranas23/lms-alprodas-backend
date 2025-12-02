import { faker } from '@faker-js/faker';
import { PrismaClient, EnrollmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class EnrollmentFactory {
  static async create(data: {
    studentId: number;
    courseId: number;
    status?: EnrollmentStatus;
    progressPercentage?: number;
  }) {
    const status = data.status || 'ACTIVE';
    const progressPercentage = data.progressPercentage || faker.number.float({ min: 0, max: 100 });

    return prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        status,
        progressPercentage,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        certificateId: status === 'COMPLETED' ? faker.string.alphanumeric(16).toUpperCase() : null,
      },
    });
  }

  static async createMany(count: number, studentId: number, courseIds: number[]) {
    const enrollments: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      const courseId = faker.helpers.arrayElement(courseIds);
      enrollments.push(await this.create({ studentId, courseId }));
    }
    return enrollments;
  }

  static async createWithProgress(data: {
    studentId: number;
    courseId: number;
    lessonIds: number[];
    completedCount?: number;
  }) {
    const enrollment = await this.create({
      studentId: data.studentId,
      courseId: data.courseId,
    });

    const completedCount = data.completedCount || faker.number.int({ min: 0, max: data.lessonIds.length });
    const completedLessons = faker.helpers.arrayElements(data.lessonIds, completedCount);

    // Create lesson progress
    await prisma.lessonProgress.createMany({
      data: completedLessons.map((lessonId) => ({
        studentId: data.studentId,
        lessonId,
        isCompleted: true,
        completedAt: faker.date.past(),
      })),
    });

    return enrollment;
  }
}