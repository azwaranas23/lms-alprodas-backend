import { faker } from '@faker-js/faker';
import { PrismaClient, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

// YouTube video IDs untuk contoh
const sampleYoutubeIds = [
  'dQw4w9WgXcQ',
  'jNQXAC9IVRw',
  '9bZkp7q19f0',
  'kJQP7kiw5Fk',
  'ZZ5LpwO-An4',
  'e-ORhEE9VVg',
  'OPf0YbXqDm0',
  'CevxZvSJLk8',
  'kXYiU_JCYtU',
  'hT_nvWreIhg',
];

export class LessonFactory {
  static async create(data: {
    sectionId: number;
    title?: string;
    contentType?: ContentType;
    orderIndex: number;
  }) {
    const contentType =
      data.contentType ||
      faker.helpers.arrayElement(['VIDEO', 'ARTICLE'] as const);

    let contentUrl: string | null = null;
    let contentText: string | null = null;

    if (contentType === 'VIDEO') {
      const randomYoutubeId = faker.helpers.arrayElement(sampleYoutubeIds);
      contentUrl = `https://www.youtube.com/watch?v=${randomYoutubeId}`;
    } else {
      contentText = faker.lorem.paragraphs(5, '\n\n');
    }

    return prisma.lesson.create({
      data: {
        sectionId: data.sectionId,
        title: data.title || faker.lorem.words(5),
        contentType,
        contentUrl,
        contentText,
        durationMinutes: faker.number.int({ min: 5, max: 45 }),
        orderIndex: data.orderIndex,
        isActive: true,
      },
    });
  }

  static async createMany(sectionId: number, count: number) {
    const lessons: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      lessons.push(
        await this.create({
          sectionId,
          orderIndex: i + 1,
        }),
      );
    }
    return lessons;
  }
}
