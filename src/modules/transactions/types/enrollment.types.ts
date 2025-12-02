import { Prisma } from '@prisma/client';

export const completeCourseEnrollmentInclude = {
  course: {
    include: {
      mentor: {
        include: {
          userProfile: true,
        },
      },
      subject: {
        include: {
          topic: true,
        },
      },
      courseImages: {
        orderBy: {
          orderIndex: 'asc' as const,
        },
      },
      courseSections: {
        include: {
          lessons: {
            where: {
              isActive: true,
            },
            orderBy: {
              orderIndex: 'asc' as const,
            },
          },
        },
        orderBy: {
          orderIndex: 'asc' as const,
        },
      },
    },
  },
} satisfies Prisma.EnrollmentInclude;

// Generated type from Prisma
export type CompleteCourseEnrollment = Prisma.EnrollmentGetPayload<{
  include: typeof completeCourseEnrollmentInclude;
}>;
