import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Bulk seeding untuk generate data besar
 */
async function bulkFactorySeed() {
  console.log('🚀 Starting bulk seeding...');
  const startTime = Date.now();

  // 1. Roles
  const studentRole = await prisma.role.findUnique({
    where: { key: 'student' },
  });
  const mentorRole = await prisma.role.findUnique({ where: { key: 'mentor' } });

  if (!studentRole || !mentorRole) {
    console.log('⚠️  Roles not found. Seed roles first.');
    return;
  }

  // 2. Students
  console.log('👥 Creating 5000 students...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const studentsData = Array.from({ length: 5000 }).map(() => ({
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    name: faker.person.fullName(),
    roleId: studentRole.id,
    isVerified: true,
    isActive: true,
  }));

  await prisma.user.createMany({ data: studentsData, skipDuplicates: true });

  const students = await prisma.user.findMany({
    where: { roleId: studentRole.id },
    select: { id: true },
  });

  console.log(`✅ Created ${students.length} students`);

  // 3. Mentors
  console.log('👨‍🏫 Creating 100 mentors...');

  const mentorsData = Array.from({ length: 100 }).map(() => ({
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    name: faker.person.fullName(),
    roleId: mentorRole.id,
    isVerified: true,
    isActive: true,
  }));

  await prisma.user.createMany({ data: mentorsData, skipDuplicates: true });

  const mentors = await prisma.user.findMany({
    where: { roleId: mentorRole.id },
    select: { id: true },
  });

  console.log(`✅ Created ${mentors.length} mentors`);

  // 4. Mentor Profiles (sesuai schema)
  console.log('📝 Creating mentor profiles...');

  const mentorProfilesData = mentors.map((m) => ({
    userId: m.id,
    bio: faker.lorem.paragraph(),
    avatar: faker.image.avatar(),
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as const),
  }));

  await prisma.userProfile.createMany({
    data: mentorProfilesData,
    skipDuplicates: true,
  });

  console.log(`✅ Profiles created: ${mentorProfilesData.length}`);

  // 5. Topics
  console.log('📂 Creating topics...');

  const topicNames = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity',
    'Blockchain',
    'Game Development',
  ];

  const topicsData = topicNames.map((name) => ({
    name,
    description: faker.lorem.paragraph(),
    image: faker.image.url(),
  }));

  await prisma.topic.createMany({ data: topicsData, skipDuplicates: true });

  const topics = await prisma.topic.findMany();
  console.log(`✅ Topics created: ${topics.length}`);

  // 6. Subjects
  console.log('📚 Creating subjects...');

  const subjectsData = topics.flatMap((topic) => [
    {
      topicId: topic.id,
      name: `${topic.name} - Beginner`,
      description: faker.lorem.paragraph(),
      image: faker.image.url(),
    },
    {
      topicId: topic.id,
      name: `${topic.name} - Advanced`,
      description: faker.lorem.paragraph(),
      image: faker.image.url(),
    },
  ]);

  await prisma.subject.createMany({ data: subjectsData });
  const subjects = await prisma.subject.findMany();

  console.log(`✅ Subjects created: ${subjects.length}`);

  // 7. Courses (tanpa price karena schema tidak punya)
  console.log('📚 Creating courses...');

  const coursesData = Array.from({ length: 500 }).map((_, i) => ({
    subjectId: subjects[i % subjects.length].id,
    mentorId: mentors[i % mentors.length].id,
    title: faker.lorem.words(5),
    description: faker.lorem.paragraph(),
    about: faker.lorem.paragraph(),
    tools: faker.lorem.words(3),
    status: 'PUBLISHED' as const,
  }));

  await prisma.course.createMany({ data: coursesData });

  const courses = await prisma.course.findMany({
    select: { id: true },
  });

  console.log(`✅ Courses created: ${courses.length}`);

  // 8. Course Images
  debugger;

  const courseImagesData = courses.flatMap((course) => [
    { courseId: course.id, imagePath: faker.image.url(), orderIndex: 1 },
    { courseId: course.id, imagePath: faker.image.url(), orderIndex: 2 },
  ]);

  await prisma.courseImage.createMany({ data: courseImagesData });

  console.log(`✅ Course Images: ${courseImagesData.length}`);

  // 9. Course Key Points
  const keyPointsData = courses.flatMap((course) =>
    Array.from({ length: 5 }).map(() => ({
      courseId: course.id,
      keyPoint: faker.lorem.sentence(),
    })),
  );

  await prisma.courseKeyPoint.createMany({ data: keyPointsData });

  console.log(`✅ Course Key Points: ${keyPointsData.length}`);

  // 10. Sections & Lessons
  console.log('📑 Creating sections & lessons...');

  const sampleYoutubeIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', '9bZkp7q19f0'];

  let totalSections = 0;
  let totalLessons = 0;

  for (const course of courses) {
    const sectionCount = faker.number.int({ min: 3, max: 5 });

    for (let i = 0; i < sectionCount; i++) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: faker.lorem.words(4),
          description: faker.lorem.paragraph(),
          orderIndex: i + 1,
        },
      });

      totalSections++;

      const lessonCount = faker.number.int({ min: 4, max: 8 });

      const lessonsData = Array.from({ length: lessonCount }).map((_, j) => {
        const type = faker.helpers.arrayElement(['VIDEO', 'ARTICLE'] as const);

        return {
          sectionId: section.id,
          title: faker.lorem.words(5),
          contentType: type,
          contentUrl:
            type === 'VIDEO'
              ? `https://www.youtube.com/watch?v=${faker.helpers.arrayElement(sampleYoutubeIds)}`
              : null,
          contentText: type === 'ARTICLE' ? faker.lorem.paragraphs(3) : null,
          durationMinutes: faker.number.int({ min: 5, max: 45 }),
          orderIndex: j + 1,
          isActive: true,
        };
      });

      await prisma.lesson.createMany({ data: lessonsData });

      totalLessons += lessonCount;
    }
  }

  console.log(`✅ Sections: ${totalSections}, Lessons: ${totalLessons}`);

  // 11. Enrollments
  console.log('📝 Creating enrollments...');

  const enrollmentsData: {
    studentId: number;
    courseId: number;
    status: 'ACTIVE' | 'COMPLETED';
    progressPercentage: number;
    completedAt: Date | null;
    certificateId: string | null;
  }[] = [];

  const usedPairs = new Set<string>();

  while (enrollmentsData.length < 3000) {
    const studentId = faker.helpers.arrayElement(students).id;
    const courseId = faker.helpers.arrayElement(courses).id;

    const pair = `${studentId}-${courseId}`;

    if (!usedPairs.has(pair)) {
      usedPairs.add(pair);
      enrollmentsData.push({
        studentId,
        courseId,
        status: faker.helpers.arrayElement(['ACTIVE', 'COMPLETED'] as const),
        progressPercentage: faker.number.float({
          min: 0,
          max: 100,
          fractionDigits: 2,
        }),
        completedAt: Math.random() > 0.7 ? faker.date.past() : null,
        certificateId:
          Math.random() > 0.7
            ? faker.string.alphanumeric(16).toUpperCase()
            : null,
      });
    }
  }

  await prisma.enrollment.createMany({
    data: enrollmentsData,
    skipDuplicates: true,
  });

  console.log(`✅ Enrollments: ${enrollmentsData.length}`);

  // 12. Reviews
  console.log('⭐ Creating reviews...');

  const reviewsData: {
    studentId: number;
    courseId: number;
    rating: number;
    reviewText: string;
  }[] = [];

  const usedReviewPairs = new Set<string>();

  while (reviewsData.length < 1500) {
    const randomEnrollment =
      enrollmentsData[Math.floor(Math.random() * enrollmentsData.length)];

    const pair = `${randomEnrollment.studentId}-${randomEnrollment.courseId}`;

    if (!usedReviewPairs.has(pair)) {
      usedReviewPairs.add(pair);
      reviewsData.push({
        studentId: randomEnrollment.studentId,
        courseId: randomEnrollment.courseId,
        rating: faker.number.int({ min: 3, max: 5 }),
        reviewText: faker.lorem.sentences(3),
      });
    }
  }

  await prisma.courseReview.createMany({
    data: reviewsData,
    skipDuplicates: true,
  });

  console.log(`✅ Reviews: ${reviewsData.length}`);

  console.log('🎉 Bulk seeding completed successfully!');
}

if (require.main === module) {
  bulkFactorySeed()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
}

export { bulkFactorySeed };
