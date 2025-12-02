import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReviewFactory {
  static async create(data: {
    studentId: number;
    courseId: number;
    rating?: number;
  }) {
    return prisma.courseReview.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        rating: data.rating || faker.number.int({ min: 3, max: 5 }),
        reviewText: faker.lorem.sentences(3),
      },
    });
  }

  static async createMany(count: number, courseId: number, studentIds: number[]) {
    const reviews: Awaited<ReturnType<typeof this.create>>[] = [];
    const selectedStudents = faker.helpers.arrayElements(studentIds, Math.min(count, studentIds.length));

    for (const studentId of selectedStudents) {
      reviews.push(await this.create({ studentId, courseId }));
    }
    return reviews;
  }
}