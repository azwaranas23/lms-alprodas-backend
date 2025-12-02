import { Decimal } from '@prisma/client/runtime/library';

export interface DashboardStatistics {
  totalRevenue: number;
  totalTransactions: number;
  totalStudents: number;
  totalCourses: number;
  totalLessons: number;
  totalWithdrawals: number;
}

export interface LatestTransactionData {
  id: number;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  transactionDate: Date;
  course: {
    id: number;
    title: string;
    image: string | null;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
}

export interface LatestCourseData {
  id: number;
  title: string;
  price: number;
  status: string;
  totalLessons: number;
  createdAt: Date;
  image: string | null;
  subject: {
    id: number;
    name: string;
  };
}

export interface LatestUserData {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  role: {
    id: number;
    name: string;
    key: string;
  };
}

export interface TransactionWithCourseAndStudent {
  id: number;
  orderId: string;
  amount: Decimal;
  status: string;
  paymentMethod: string | null;
  transactionDate: Date;
  course: {
    id: number;
    title: string;
    courseImages: Array<{
      id: number;
      imagePath: string;
    }>;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CourseWithSubject {
  id: number;
  title: string;
  price: Decimal;
  status: string;
  totalLessons: number;
  createdAt: Date;
  courseImages?: Array<{
    id: number;
    imagePath: string;
  }>;
  subject: {
    id: number;
    name: string;
  };
}

export interface UserWithRole {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  userProfile: {
    avatar: string | null;
  } | null;
  role: {
    id: number;
    name: string;
    key: string;
  };
}
