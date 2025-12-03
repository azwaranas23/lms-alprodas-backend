import { Prisma } from '@prisma/client';

// Include struktur lengkap course + sections + lessons
export const completeCourseEnrollmentInclude = {
  course: {
    include: {
      subject: {
        include: {
          topic: true,
        },
      },
      mentor: {
        include: {
          userProfile: true,
        },
      },
      courseImages: true,
      courseSections: {
        include: {
          lessons: true,
        },
      },
    },
  },
} satisfies Prisma.EnrollmentInclude;

export type CompleteCourseEnrollment = Prisma.EnrollmentGetPayload<{
  include: typeof completeCourseEnrollmentInclude;
}>;
