import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CourseSectionData {
  title: string;
  description?: string;
  courseTitle: string;
  orderIndex: number;
}

interface CourseSectionsJsonData {
  data: CourseSectionData[];
}

export async function courseSectionsSeed() {
  const courseSectionsPath = path.resolve(
    __dirname,
    'data',
    'course-sections.json',
  );
  const courseSectionsRaw = fs.readFileSync(courseSectionsPath, 'utf-8');
  const courseSectionsJson = JSON.parse(
    courseSectionsRaw,
  ) as CourseSectionsJsonData;
  const courseSections = courseSectionsJson.data;

  const courses = await prisma.course.findMany();

  for (const section of courseSections) {
    const course = courses.find((c) => c.title === section.courseTitle);

    if (!course) {
      console.warn(
        `Course not found for section: ${section.title}, courseTitle: ${section.courseTitle}`,
      );
      continue;
    }

    const existingSection = await prisma.courseSection.findFirst({
      where: {
        title: section.title,
        courseId: course.id,
      },
    });

    if (!existingSection) {
      await prisma.courseSection.create({
        data: {
          title: section.title,
          description: section.description,
          courseId: course.id,
          orderIndex: section.orderIndex,
        },
      });
      console.log(`Inserted new course section: ${section.title}`);
    } else {
      console.log(`Course section already exists: ${section.title}`);
    }
  }
}

// For running directly
if (require.main === module) {
  courseSectionsSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
