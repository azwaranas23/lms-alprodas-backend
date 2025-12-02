import {
  Course,
  CourseImage,
  CourseKeyPoint,
  CoursePersona,
  CourseResource,
  CourseReview,
  CourseSection,
  CourseStatus,
  Lesson,
  Prisma,
  Subject,
  Topic,
  User,
  UserProfile,
} from '@prisma/client';

export type CourseWithRelations = Course & {
  subject: Subject & {
    topic: Topic;
  };
  mentor: User & {
    userProfile?: UserProfile | null;
  };
  courseImages: CourseImage[];
  courseKeyPoints: CourseKeyPoint[];
  coursePersonas: CoursePersona[];
  courseResources: CourseResource[];
  courseSections: (CourseSection & {
    lessons: Lesson[];
  })[];
  courseReviews: (CourseReview & {
    student: User & {
      userProfile?: UserProfile | null;
    };
  })[];
};

export type EnrollmentWithCourse = {
  progressPercentage: Prisma.Decimal;
  enrolledAt: Date;
  certificateId: string | null;
  course: {
    id: number;
    title: string;
    description: string | null;
    price: Prisma.Decimal;
    status: CourseStatus;
    totalLessons: number;
    mentor: {
      id: number;
      name: string;
      userProfile: {
        avatar: string | null;
        expertise: string | null;
      } | null;
    };
    subject: {
      id: number;
      name: string;
      topic: {
        id: number;
        name: string;
      };
    };
    courseImages: {
      imagePath: string;
    }[];
  };
};
