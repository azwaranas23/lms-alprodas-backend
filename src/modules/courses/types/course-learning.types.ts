import {
  Course,
  CourseSection,
  Lesson,
  LessonProgress,
  Prisma,
} from '@prisma/client';

export type LessonProgressWithLesson = LessonProgress & {
  lesson: {
    id: number;
    title: string;
    orderIndex: number;
    sectionId: number;
  };
};

export type ProgressStats = {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
};

export type LessonWithNavigation = Lesson & {
  section: CourseSection & {
    course: Course;
    lessons: {
      id: number;
      title: string;
      orderIndex: number;
    }[];
  };
  lessonProgress: LessonProgress[];
  navigation: {
    previousLesson: SimpleLesson | null;
    nextLesson: SimpleLesson | null;
  };
};

export type SimpleLesson = {
  id: number;
  title: string;
  orderIndex: number;
};

export const courseWithProgressInclude = {
  subject: {
    include: { topic: true },
  },
  mentor: {
    include: { userProfile: true },
  },
  courseImages: {
    orderBy: { orderIndex: 'asc' as const },
  },
  courseSections: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' as const },
        include: {
          lessonProgress: true,
        },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: typeof courseWithProgressInclude;
}>;

export type SubjectData = CourseWithRelations['subject'];
export type MentorData = CourseWithRelations['mentor'];
export type SectionData = CourseWithRelations['courseSections'][0];
export type LessonData = SectionData['lessons'][0];
