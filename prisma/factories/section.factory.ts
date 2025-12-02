import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SectionFactory {
  static async create(data: {
    courseId: number;
    title?: string;
    orderIndex: number;
  }) {
    return prisma.courseSection.create({
      data: {
        courseId: data.courseId,
        title: data.title || faker.lorem.words(4),
        description: faker.lorem.paragraph(),
        orderIndex: data.orderIndex,
        totalLessons: 0,
      },
    });
  }

  static async createMany(courseId: number, count: number) {
    const sections: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      sections.push(
        await this.create({
          courseId,
          orderIndex: i + 1,
        })
      );
    }
    return sections;
  }
}