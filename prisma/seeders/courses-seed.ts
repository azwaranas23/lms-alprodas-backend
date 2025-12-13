import { CourseStatus, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CourseData {
  title: string;
  description?: string;
  about?: string;
  status: CourseStatus;
  subjectName: string;
  mentorEmail: string;
  courseToken?: string;
  keyPoints?: string[];
  personas?: string[];
  images?: string[];
  reviews?: {
    studentEmail: string;
    rating: number;
    comment?: string;
  }[];
}

interface CoursesJsonData {
  data: CourseData[];
}

export async function coursesSeed() {
  const coursesPath = path.resolve(__dirname, 'data', 'courses.json');
  const coursesRaw = fs.readFileSync(coursesPath, 'utf-8');
  const coursesJson = JSON.parse(coursesRaw) as CoursesJsonData;
  const courses = coursesJson.data;

  const subjects = await prisma.subject.findMany();
  const users = await prisma.user.findMany();

  for (const course of courses) {
    const subject = subjects.find((s) => s.name === course.subjectName);

    if (!subject) {
      console.warn(
        `Subject not found for course: ${course.title}, subjectName: ${course.subjectName}`,
      );
      continue;
    }

    const mentor = users.find((u) => u.email === course.mentorEmail);

    if (!mentor) {
      console.warn(
        `Mentor not found for course: ${course.title}, mentorEmail: ${course.mentorEmail}`,
      );
      continue;
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        title: course.title,
        subjectId: subject.id,
        mentorId: mentor.id,
      },
    });

    if (!existingCourse) {
      await prisma.$transaction(async (prisma) => {
        const createdCourse = await prisma.course.create({
          data: {
            title: course.title,
            description: course.description,
            about: course.about,
            status: course.status,
            subjectId: subject.id,
            mentorId: mentor.id,
            courseToken: course.courseToken || Math.random().toString(36).substring(7).toUpperCase(),
          },
        });

        if (course.keyPoints && course.keyPoints.length > 0) {
          await prisma.courseKeyPoint.createMany({
            data: course.keyPoints.map((point) => ({
              keyPoint: point,
              courseId: createdCourse.id,
            })),
            skipDuplicates: true,
          });
        }

        if (course.personas && course.personas.length > 0) {
          await prisma.coursePersona.createMany({
            data: course.personas.map((persona) => ({
              persona,
              courseId: createdCourse.id,
            })),
            skipDuplicates: true,
          });
        }

        if (course.images && course.images.length > 0) {
          await prisma.courseImage.createMany({
            data: course.images.map((imageUrl, index) => ({
              imagePath: imageUrl,
              courseId: createdCourse.id,
              orderIndex: index + 1,
            })),
            skipDuplicates: true,
          });
        }

        if (course.reviews && course.reviews.length > 0) {
          for (const review of course.reviews) {
            const student = users.find((u) => u.email === review.studentEmail);

            if (student) {
              await prisma.courseReview.create({
                data: {
                  rating: review.rating,
                  reviewText: review.comment,
                  courseId: createdCourse.id,
                  studentId: student.id,
                },
              });
            } else {
              console.warn(
                `Student not found for course review: ${course.title}, studentEmail: ${review.studentEmail}`,
              );
            }
          }
        }
      });

      console.log(`Inserted new course: ${course.title}`);
    } else {
      console.log(`Course already exists: ${course.title}`);
    }
  }
}

// For running directly
if (require.main === module) {
  coursesSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
