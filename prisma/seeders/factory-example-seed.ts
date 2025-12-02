import { PrismaClient } from '@prisma/client';
import { UserFactory } from '../factories/user.factory';
import { CourseFactory } from '../factories/course.factory';
import { EnrollmentFactory } from '../factories/enrollment.factory';
import { TransactionFactory } from '../factories/transaction.factory';
import { ReviewFactory } from '../factories/review.factory';
import { SectionFactory } from '../factories/section.factory';
import { LessonFactory } from '../factories/lesson.factory';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * Contoh penggunaan factory untuk generate data dummy
 * Jalankan dengan: npx ts-node prisma/seeders/factory-example-seed.ts
 */
export async function factoryExampleSeed() {
  console.log('🏭 Seeding dengan Factory...');

  // 1. Cari atau buat role
  let studentRole = await prisma.role.findUnique({ where: { key: 'student' } });
  let mentorRole = await prisma.role.findUnique({ where: { key: 'mentor' } });

  if (!studentRole || !mentorRole) {
    console.log('⚠️  Role tidak ditemukan, pastikan sudah menjalankan seed roles terlebih dahulu');
    return;
  }

  // 2. Generate 6 topics
  console.log('📂 Membuat 6 topics...');
  const topicNames = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'Cloud Computing',
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

  // 3. Generate 12 subjects (2 per topic)
  console.log('📚 Membuat 12 subjects...');
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

  // 4. Generate 20 students dengan profile
  console.log('👥 Membuat 20 students...');
  const students: NonNullable<Awaited<ReturnType<typeof UserFactory.createWithProfile>>>[] = [];
  for (let i = 0; i < 20; i++) {
    const student = await UserFactory.createWithProfile({
      roleId: studentRole.id,
      name: undefined, // akan di-generate otomatis
      email: undefined, // akan di-generate otomatis
    });
    if (student) students.push(student);
  }

  // 5. Generate 5 mentors dengan profile
  console.log('👨‍🏫 Membuat 5 mentors...');
  const mentors: NonNullable<Awaited<ReturnType<typeof UserFactory.createWithProfile>>>[] = [];
  for (let i = 0; i < 5; i++) {
    const mentor = await UserFactory.createWithProfile({
      roleId: mentorRole.id,
    });
    if (mentor) mentors.push(mentor);
  }

  // 6. Generate 15 courses dengan details (images, key points, personas)
  console.log('📚 Membuat 15 courses...');
  const courses: NonNullable<Awaited<ReturnType<typeof CourseFactory.createWithDetails>>>[] = [];
  for (let i = 0; i < 15; i++) {
    const course = await CourseFactory.createWithDetails({
      subjectId: subjects[i % subjects.length].id,
      mentorId: mentors[i % mentors.length].id,
      price: Math.floor(Math.random() * 4900000) + 100000,
    });
    if (course) courses.push(course);
  }

  // 7. Generate sections and lessons for each course
  console.log('📑 Membuat sections dan lessons untuk courses...');
  let totalSections = 0;
  let totalLessons = 0;

  for (const course of courses) {
    // Each course gets 3-4 sections
    const sections = await SectionFactory.createMany(course.id, faker.number.int({ min: 3, max: 4 }));
    totalSections += sections.length;

    for (const section of sections) {
      // Each section gets 5-7 lessons
      const lessons = await LessonFactory.createMany(section.id, faker.number.int({ min: 5, max: 7 }));
      totalLessons += lessons.length;

      // Update section totalLessons
      await prisma.courseSection.update({
        where: { id: section.id },
        data: { totalLessons: lessons.length },
      });
    }
  }
  console.log(`✅ Created ${totalSections} sections and ${totalLessons} lessons`);

  // 8. Generate enrollments untuk students
  console.log('📝 Membuat enrollments...');
  for (const student of students.slice(0, 15)) {
    // Setiap student enroll ke 2-5 courses
    const enrollCount = Math.floor(Math.random() * 4) + 2;
    const selectedCourses = courses.sort(() => 0.5 - Math.random()).slice(0, enrollCount);

    for (const course of selectedCourses) {
      await EnrollmentFactory.create({
        studentId: student.id,
        courseId: course.id,
      });
    }
  }

  // 9. Generate transactions
  console.log('💰 Membuat transactions...');
  const enrollments = await prisma.enrollment.findMany({
    include: { course: true },
  });

  for (const enrollment of enrollments) {
    await TransactionFactory.create({
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      basePrice: Number(enrollment.course.price),
      status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
    });
  }

  // 10. Generate reviews untuk beberapa course
  console.log('⭐ Membuat reviews...');
  for (const course of courses.slice(0, 10)) {
    const enrolledStudents = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      select: { studentId: true },
    });

    if (enrolledStudents.length > 0) {
      const reviewCount = Math.min(Math.floor(Math.random() * 5) + 3, enrolledStudents.length);
      await ReviewFactory.createMany(
        reviewCount,
        course.id,
        enrolledStudents.map((e) => e.studentId)
      );
    }
  }

  const transactions = await prisma.transaction.findMany();
  const reviews = await prisma.courseReview.findMany();

  // 11. Update totalCourses for each subject
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

  // 12. Update totalStudents and totalLessons for each course
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

  console.log('\n✅ Factory seeding selesai!');
  console.log(`   - Topics: ${topics.length}`);
  console.log(`   - Subjects: ${subjects.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Mentors: ${mentors.length}`);
  console.log(`   - Courses: ${courses.length}`);
  console.log(`   - Sections: ${totalSections}`);
  console.log(`   - Lessons: ${totalLessons}`);
  console.log(`   - Enrollments: ${enrollments.length}`);
  console.log(`   - Transactions: ${transactions.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
}

// Jalankan jika dipanggil langsung
if (require.main === module) {
  factoryExampleSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}