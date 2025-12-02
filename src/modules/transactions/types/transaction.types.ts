import { Gender, Prisma, Transaction } from '@prisma/client';

export type TransactionWithCourse = Transaction & {
  course: {
    id: number;
    title: string;
    price: Prisma.Decimal;
    subject: {
      id: number;
      name: string;
    };
    courseImages: Array<{
      id: number;
      imagePath: string;
    }>;
    mentor: {
      id: number;
      name: string;
      email: string;
      userProfile: {
        bio: string | null;
        avatar: string | null;
        gender: Gender | null;
        expertise: string | null;
        experienceYears: number | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
      } | null;
    };
  };
  student: {
    id: number;
    name: string;
    email: string;
    userProfile: {
      bio: string | null;
      avatar: string | null;
      gender: Gender | null;
      expertise: string | null;
      experienceYears: number | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
    } | null;
  };
};

export type TransactionWithDetails = Transaction & {
  course: {
    id: number;
    title: string;
    description: string | null;
    price: Prisma.Decimal;
    subject: {
      id: number;
      name: string;
    };
    mentor: {
      id: number;
      name: string;
      email: string;
      userProfile: {
        githubUrl: string | null;
        linkedinUrl: string | null;
        experienceYears: number | null;
        gender: Gender | null;
        avatar: string | null;
        bio: string | null;
        expertise: string | null;
      } | null;
    };
  };
  student: {
    id: number;
    name: string;
    email: string;
    userProfile: {
      bio: string | null;
      avatar: string | null;
      gender: Gender | null;
      expertise: string | null;
      experienceYears: number | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
    } | null;
  };
};
