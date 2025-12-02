import { ContentType, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface LessonData {
  title: string;
  contentType: ContentType;
  contentUrl?: string | null;
  contentText?: string | null;
  durationMinutes?: number;
  orderIndex: number;
  sectionTitle: string;
  courseTitle: string;
}

interface LessonsJsonData {
  data: LessonData[];
}

export async function lessonsSeed() {
  const lessonsPath = path.resolve(__dirname, 'data', 'lessons.json');
  const lessonsRaw = fs.readFileSync(lessonsPath, 'utf-8');
  const lessonsJson = JSON.parse(lessonsRaw) as LessonsJsonData;
  const lessons = lessonsJson.data;

  const courseSections = await prisma.courseSection.findMany({
    include: {
      course: true,
    },
  });

  for (const lesson of lessons) {
    const section = courseSections.find(
      (s) =>
        s.title === lesson.sectionTitle &&
        s.course.title === lesson.courseTitle,
    );

    if (!section) {
      console.warn(
        `Course section not found for lesson: ${lesson.title}, sectionTitle: ${lesson.sectionTitle}, courseTitle: ${lesson.courseTitle}`,
      );
      continue;
    }

    const existingLesson = await prisma.lesson.findFirst({
      where: {
        title: lesson.title,
        sectionId: section.id,
      },
    });

    if (!existingLesson) {
      await prisma.lesson.create({
        data: {
          title: lesson.title,
          contentType: lesson.contentType,
          contentUrl: lesson.contentUrl,
          contentText: lesson.contentText,
          durationMinutes: lesson.durationMinutes,
          orderIndex: lesson.orderIndex,
          sectionId: section.id,
        },
      });

      console.log(`Inserted new lesson: ${lesson.title}`);
    } else {
      console.log(`Lesson already exists: ${lesson.title}`);
    }
  }

  const sectionLessonCounts = await prisma.lesson.groupBy({
    by: ['sectionId'],
    _count: {
      id: true,
    },
  });

  const sectionUpdates = sectionLessonCounts.map((section) =>
    prisma.courseSection.update({
      where: { id: section.sectionId },
      data: { totalLessons: section._count.id },
    }),
  );

  await prisma.$transaction(sectionUpdates);

  const courseLessonCounts = await prisma.lesson.groupBy({
    by: ['sectionId'],
    _count: {
      id: true,
    },
    _sum: {
      sectionId: true,
    },
  });

  const sectionToCourse = await prisma.courseSection.findMany({
    select: {
      id: true,
      courseId: true,
    },
  });

  const courseCountMap = new Map<number, number>();

  courseLessonCounts.forEach((section) => {
    const sectionInfo = sectionToCourse.find((s) => s.id === section.sectionId);
    if (sectionInfo) {
      const currentCount = courseCountMap.get(sectionInfo.courseId) || 0;
      courseCountMap.set(
        sectionInfo.courseId,
        currentCount + section._count.id,
      );
    }
  });

  const courseUpdates = Array.from(courseCountMap.entries()).map(
    ([courseId, totalLessons]) =>
      prisma.course.update({
        where: { id: courseId },
        data: { totalLessons },
      }),
  );

  await prisma.$transaction(courseUpdates);

  console.log('Updated totalLessons for course sections and courses');
}

// For running directly
if (require.main === module) {
  lessonsSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
