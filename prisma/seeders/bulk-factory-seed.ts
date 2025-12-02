import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Bulk seeding untuk generate data dalam jumlah besar
 * Target: ~10,000+ records
 * Jalankan dengan: npx ts-node prisma/seeders/bulk-factory-seed.ts
 */
async function bulkFactorySeed() {
  console.log('🚀 Starting bulk seeding...');
  const startTime = Date.now();

  // 1. Get existing roles
  const studentRole = await prisma.role.findUnique({ where: { key: 'student' } });
  const mentorRole = await prisma.role.findUnique({ where: { key: 'mentor' } });

  if (!studentRole || !mentorRole) {
    console.log('⚠️  Roles not found. Please run roles seed first.');
    return;
  }

  // 2. Bulk create students (5000 students)
  console.log('👥 Creating 5000 students...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const studentsData = Array.from({ length: 5000 }, (_, i) => ({
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    name: faker.person.fullName(),
    roleId: studentRole.id,
    phone: faker.phone.number().slice(0, 20),
    isVerified: true,
    isActive: true,
  }));

  await prisma.user.createMany({
    data: studentsData,
    skipDuplicates: true,
  });

  const students = await prisma.user.findMany({
    where: { roleId: studentRole.id },
    select: { id: true },
  });
  console.log(`✅ Created ${students.length} students`);

  // 3. Bulk create mentors (100 mentors)
  console.log('👨‍🏫 Creating 100 mentors...');
  const mentorsData = Array.from({ length: 100 }, (_, i) => ({
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    name: faker.person.fullName(),
    roleId: mentorRole.id,
    phone: faker.phone.number().slice(0, 20),
    isVerified: true,
    isActive: true,
  }));

  await prisma.user.createMany({
    data: mentorsData,
    skipDuplicates: true,
  });

  const mentors = await prisma.user.findMany({
    where: { roleId: mentorRole.id },
    select: { id: true },
  });
  console.log(`✅ Created ${mentors.length} mentors`);

  // 4. Create user profiles for mentors (important for mentor display)
  console.log('📝 Creating profiles for mentors...');
  const mentorProfilesData = mentors.map((mentor) => ({
    userId: mentor.id,
    bio: faker.lorem.paragraph(),
    avatar: faker.image.avatar(),
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE'] as const),
    expertise: faker.person.jobTitle(),
    experienceYears: faker.number.int({ min: 1, max: 20 }),
    linkedinUrl: `https://linkedin.com/in/${faker.internet.username()}`,
    githubUrl: `https://github.com/${faker.internet.username()}`,
  }));

  await prisma.userProfile.createMany({
    data: mentorProfilesData,
    skipDuplicates: true,
  });
  console.log(`✅ Created profiles for ${mentorProfilesData.length} mentors`);

  // 5. Create topics (9 topics)
  console.log('📂 Creating 9 topics...');
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
    description: faker.lorem.paragraph(2),
    image: faker.image.url(),
  }));

  await prisma.topic.createMany({
    data: topicsData,
    skipDuplicates: true,
  });

  const topics = await prisma.topic.findMany();
  console.log(`✅ Created ${topics.length} topics`);

  // 6. Create subjects (18 subjects - 2 per topic)
  console.log('📚 Creating 18 subjects...');
  const subjectsData = topics.flatMap((topic) => [
    {
      topicId: topic.id,
      name: `${topic.name} - Beginner`,
      description: faker.lorem.paragraph(2),
      image: faker.image.url(),
    },
    {
      topicId: topic.id,
      name: `${topic.name} - Advanced`,
      description: faker.lorem.paragraph(2),
      image: faker.image.url(),
    },
  ]);

  await prisma.subject.createMany({
    data: subjectsData,
    skipDuplicates: true,
  });

  const subjects = await prisma.subject.findMany();
  console.log(`✅ Created ${subjects.length} subjects`);

  // 6. Bulk create courses (500 courses)
  console.log('📚 Creating 500 courses...');
  const coursesData = Array.from({ length: 500 }, (_, i) => ({
    subjectId: subjects[i % subjects.length].id,
    mentorId: mentors[i % mentors.length].id,
    title: faker.lorem.words(5),
    description: faker.lorem.paragraph(3),
    about: faker.lorem.paragraphs(2),
    tools: JSON.stringify([
      faker.company.buzzNoun(),
      faker.company.buzzNoun(),
      faker.company.buzzNoun(),
    ]),
    price: faker.number.float({ min: 100000, max: 5000000, fractionDigits: 0 }),
    status: 'PUBLISHED' as const,
  }));

  await prisma.course.createMany({
    data: coursesData,
  });

  const courses = await prisma.course.findMany({
    select: { id: true, price: true },
  });
  console.log(`✅ Created ${courses.length} courses`);

  // 7. Bulk create course images
  console.log('🖼️  Creating course images...');
  const courseImagesData = courses.flatMap((course) => [
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
  ]);

  await prisma.courseImage.createMany({
    data: courseImagesData,
  });
  console.log(`✅ Created ${courseImagesData.length} course images`);

  // 8. Bulk create course key points
  console.log('🔑 Creating course key points...');
  const keyPointsData = courses.flatMap((course) =>
    Array.from({ length: 5 }, (_, i) => ({
      courseId: course.id,
      keyPoint: faker.lorem.sentence(),
    }))
  );

  await prisma.courseKeyPoint.createMany({
    data: keyPointsData,
  });
  console.log(`✅ Created ${keyPointsData.length} key points`);

  // 9. Bulk create sections and lessons for each course
  console.log('📑 Creating sections and lessons for courses...');

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

  let totalSections = 0;
  let totalLessons = 0;

  for (const course of courses) {
    // Each course gets 3-5 sections
    const sectionCount = faker.number.int({ min: 3, max: 5 });

    for (let i = 0; i < sectionCount; i++) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: faker.lorem.words(4),
          description: faker.lorem.paragraph(),
          orderIndex: i + 1,
          totalLessons: 0,
        },
      });
      totalSections++;

      // Each section gets 4-8 lessons
      const lessonCount = faker.number.int({ min: 4, max: 8 });
      const lessonsData: Array<{
        sectionId: number;
        title: string;
        contentType: 'VIDEO' | 'ARTICLE';
        contentUrl: string | null;
        contentText: string | null;
        durationMinutes: number;
        orderIndex: number;
        isActive: boolean;
      }> = [];

      for (let j = 0; j < lessonCount; j++) {
        const contentType = faker.helpers.arrayElement(['VIDEO', 'ARTICLE'] as const);
        let contentUrl: string | null = null;
        let contentText: string | null = null;

        if (contentType === 'VIDEO') {
          const randomYoutubeId = faker.helpers.arrayElement(sampleYoutubeIds);
          contentUrl = `https://www.youtube.com/watch?v=${randomYoutubeId}`;
        } else {
          contentText = faker.lorem.paragraphs(5, '\n\n');
        }

        lessonsData.push({
          sectionId: section.id,
          title: faker.lorem.words(5),
          contentType,
          contentUrl,
          contentText,
          durationMinutes: faker.number.int({ min: 5, max: 45 }),
          orderIndex: j + 1,
          isActive: true,
        });
      }

      await prisma.lesson.createMany({
        data: lessonsData,
      });
      totalLessons += lessonCount;

      // Update section totalLessons
      await prisma.courseSection.update({
        where: { id: section.id },
        data: { totalLessons: lessonCount },
      });
    }
  }

  console.log(`✅ Created ${totalSections} sections and ${totalLessons} lessons`);

  // 10. Bulk create enrollments (3000 enrollments)
  console.log('📝 Creating 3000 enrollments...');
  const enrollmentsData: Array<{
    studentId: number;
    courseId: number;
    status: 'ACTIVE' | 'COMPLETED';
    progressPercentage: number;
    completedAt: Date | null;
    certificateId: string | null;
  }> = [];
  const usedPairs = new Set<string>();

  while (enrollmentsData.length < 3000) {
    const studentId = students[Math.floor(Math.random() * students.length)].id;
    const courseId = courses[Math.floor(Math.random() * courses.length)].id;
    const pair = `${studentId}-${courseId}`;

    if (!usedPairs.has(pair)) {
      usedPairs.add(pair);
      enrollmentsData.push({
        studentId,
        courseId,
        status: faker.helpers.arrayElement(['ACTIVE', 'COMPLETED'] as const),
        progressPercentage: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        completedAt: Math.random() > 0.7 ? faker.date.past() : null,
        certificateId: Math.random() > 0.7 ? faker.string.alphanumeric(16).toUpperCase() : null,
      });
    }
  }

  await prisma.enrollment.createMany({
    data: enrollmentsData,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${enrollmentsData.length} enrollments`);

  // 10. Bulk create transactions (3000 transactions)
  console.log('💰 Creating 3000 transactions...');
  const enrollments = await prisma.enrollment.findMany({
    include: { course: true },
    take: 3000,
  });

  const transactionsData = enrollments.map((enrollment) => {
    const basePrice = Number(enrollment.course.price);
    const ppnRate = 0.11;
    const ppnAmount = basePrice * ppnRate;
    const platformFeeRate = 0.05;
    const platformFee = basePrice * platformFeeRate;
    const grossAmount = basePrice + ppnAmount;
    const mentorNetAmount = basePrice - platformFee;
    const status = faker.helpers.arrayElement(['PENDING', 'PAID', 'EXPIRED'] as const);
    const orderId = `TRX-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`;

    return {
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      amount: grossAmount,
      basePrice,
      ppnAmount,
      ppnRate,
      platformFee,
      platformFeeRate,
      mentorNetAmount,
      status,
      paymentMethod: status === 'PAID' ? faker.helpers.arrayElement(['bank_transfer', 'credit_card', 'gopay', 'shopeepay']) : null,
      orderId,
      snapToken: status === 'PENDING' ? faker.string.alphanumeric(64) : null,
      snapRedirectUrl: status === 'PENDING' ? `https://app.sandbox.midtrans.com/snap/v2/vtweb/${faker.string.alphanumeric(32)}` : null,
      grossAmount,
      currency: 'IDR',
      paidAt: status === 'PAID' ? faker.date.past() : null,
      expiredAt: status === 'PENDING' ? faker.date.future() : null,
    };
  });

  await prisma.transaction.createMany({
    data: transactionsData,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${transactionsData.length} transactions`);

  // 11. Bulk create reviews (1500 reviews)
  console.log('⭐ Creating 1500 reviews...');
  const reviewsData: Array<{
    studentId: number;
    courseId: number;
    rating: number;
    reviewText: string;
  }> = [];
  const usedReviewPairs = new Set<string>();

  while (reviewsData.length < 1500) {
    const enrollment = enrollments[Math.floor(Math.random() * enrollments.length)];
    const pair = `${enrollment.studentId}-${enrollment.courseId}`;

    if (!usedReviewPairs.has(pair)) {
      usedReviewPairs.add(pair);
      reviewsData.push({
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        rating: faker.number.int({ min: 3, max: 5 }),
        reviewText: faker.lorem.sentences(3),
      });
    }
  }

  await prisma.courseReview.createMany({
    data: reviewsData,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${reviewsData.length} reviews`);

  // 12. Update totalCourses for each subject
  console.log('🔄 Updating totalCourses for subjects...');
  for (const subject of subjects) {
    const courseCount = await prisma.course.count({
      where: { subjectId: subject.id },
    });
    await prisma.subject.update({
      where: { id: subject.id },
      data: { totalCourses: courseCount },
    });
  }
  console.log(`✅ Updated totalCourses for ${subjects.length} subjects`);

  // 13. Update totalStudents and totalLessons for each course
  console.log('🔄 Updating totalStudents and totalLessons for courses...');
  for (const course of courses) {
    const studentCount = await prisma.enrollment.count({
      where: { courseId: course.id },
    });
    const lessonCount = await prisma.lesson.count({
      where: {
        section: {
          courseId: course.id,
        },
      },
    });
    await prisma.course.update({
      where: { id: course.id },
      data: {
        totalStudents: studentCount,
        totalLessons: lessonCount,
      },
    });
  }
  console.log(`✅ Updated totalStudents and totalLessons for ${courses.length} courses`);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  const totalRecords =
    students.length +
    mentors.length +
    mentorProfilesData.length +
    topics.length +
    subjects.length +
    courses.length +
    courseImagesData.length +
    keyPointsData.length +
    totalSections +
    totalLessons +
    enrollmentsData.length +
    transactionsData.length +
    reviewsData.length;

  console.log('\n🎉 Bulk seeding completed!');
  console.log('=====================================');
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Mentors: ${mentors.length}`);
  console.log(`   - Mentor Profiles: ${mentorProfilesData.length}`);
  console.log(`   - Topics: ${topics.length}`);
  console.log(`   - Subjects: ${subjects.length}`);
  console.log(`   - Courses: ${courses.length}`);
  console.log(`   - Course Images: ${courseImagesData.length}`);
  console.log(`   - Course Key Points: ${keyPointsData.length}`);
  console.log(`   - Sections: ${totalSections}`);
  console.log(`   - Lessons: ${totalLessons}`);
  console.log(`   - Enrollments: ${enrollmentsData.length}`);
  console.log(`   - Transactions: ${transactionsData.length}`);
  console.log(`   - Reviews: ${reviewsData.length}`);
  console.log(`   - Total Records: ${totalRecords}`);
  console.log(`   - Duration: ${duration}s`);
  console.log('=====================================');
}

// Run if called directly
if (require.main === module) {
  bulkFactorySeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}

export { bulkFactorySeed };