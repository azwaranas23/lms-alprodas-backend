import { faker } from '@faker-js/faker';
import { PrismaClient, CourseStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class CourseFactory {
  static async create(data?: {
    subjectId?: number;
    mentorId?: number;
    title?: string;
    price?: number;
    status?: CourseStatus;
  }) {
    return prisma.course.create({
      data: {
        subjectId: data?.subjectId || 1,
        mentorId: data?.mentorId || 1,
        title: data?.title || faker.lorem.words(5),
        description: faker.lorem.paragraph(3),
        about: faker.lorem.paragraphs(2),
        tools: JSON.stringify([
          faker.company.buzzNoun(),
          faker.company.buzzNoun(),
          faker.company.buzzNoun(),
        ]),
        price: data?.price || faker.number.float({ min: 100000, max: 5000000 }),
        status: data?.status || 'PUBLISHED',
        totalLessons: 0,
        totalStudents: 0,
      },
    });
  }

  static async createWithDetails(data?: {
    subjectId?: number;
    mentorId?: number;
    title?: string;
    price?: number;
  }) {
    const course = await this.create(data);

    // Add course images
    await prisma.courseImage.createMany({
      data: [
        {
          courseId: course.id,
          imagePath: faker.image.url(),
          orderIndex: 1,
        },
        {
          courseId: course.id,
          imagePath: faker.image.url(),
          orderIndex: 2,
        },
      ],
    });

    // Add key points
    await prisma.courseKeyPoint.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        courseId: course.id,
        keyPoint: faker.lorem.sentence(),
      })),
    });

    // Add personas
    await prisma.coursePersona.createMany({
      data: Array.from({ length: 3 }, (_, i) => ({
        courseId: course.id,
        persona: faker.person.jobTitle(),
      })),
    });

    return prisma.course.findUnique({
      where: { id: course.id },
      include: {
        courseImages: true,
        courseKeyPoints: true,
        coursePersonas: true,
      },
    });
  }

  static async createMany(count: number, subjectId?: number, mentorId?: number) {
    const courses: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      courses.push(await this.create({ subjectId, mentorId }));
    }
    return courses;
  }
}