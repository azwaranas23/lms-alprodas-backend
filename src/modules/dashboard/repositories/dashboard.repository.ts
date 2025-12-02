import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CourseWithSubject,
  DashboardStatistics,
  LatestCourseData,
  LatestTransactionData,
  TransactionWithCourseAndStudent,
  UserWithRole,
} from '../interfaces/dashboard.interface';
import { TransactionStatus, WithdrawalStatus } from '@prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  LatestCourseDto,
  LatestUserDto,
} from '../dto/latest-data-response.dto';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMentorStatistics(mentorId: number): Promise<DashboardStatistics> {
    const [
      revenueResult,
      transactionsResult,
      studentsResult,
      coursesResult,
      lessonsResult,
      withdrawalsResult,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          course: { mentorId },
          status: TransactionStatus.PAID,
        },
        _sum: {
          mentorNetAmount: true,
        },
      }),
      this.prisma.transaction.count({
        where: { course: { mentorId } },
      }),
      this.prisma.user.count({
        where: {
          role: {
            key: UserRole.STUDENT,
          },
          enrollments: {
            some: {
              course: { mentorId },
            },
          },
        },
      }),
      this.prisma.course.count({
        where: {
          mentorId,
        },
      }),
      this.prisma.lesson.count({
        where: {
          section: {
            course: { mentorId },
          },
        },
      }),
      this.prisma.withdrawal.aggregate({
        where: {
          userId: mentorId,
          status: WithdrawalStatus.COMPLETED,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalRevenue: Number(revenueResult._sum.mentorNetAmount) || 0,
      totalTransactions: Number(transactionsResult) || 0,
      totalStudents: Number(studentsResult) || 0,
      totalCourses: Number(coursesResult) || 0,
      totalLessons: Number(lessonsResult) || 0,
      totalWithdrawals: Number(withdrawalsResult._sum.amount) || 0,
    };
  }

  async getAdminStatistics(): Promise<DashboardStatistics> {
    const [
      revenueResult,
      transactionsResult,
      studentsResult,
      coursesResult,
      lessonsResult,
      withdrawalsResult,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          status: TransactionStatus.PAID,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.transaction.count(),
      this.prisma.user.count({
        where: {
          role: {
            key: UserRole.STUDENT,
          },
        },
      }),
      this.prisma.course.count(),
      this.prisma.lesson.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.withdrawal.aggregate({
        where: {
          status: WithdrawalStatus.COMPLETED,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalRevenue: Number(revenueResult._sum.amount) || 0,
      totalTransactions: Number(transactionsResult) || 0,
      totalStudents: Number(studentsResult) || 0,
      totalCourses: Number(coursesResult) || 0,
      totalLessons: Number(lessonsResult) || 0,
      totalWithdrawals: Number(withdrawalsResult._sum.amount) || 0,
    };
  }

  async findLatestTransaction(
    limit: number = 5,
    mentorId?: number,
  ): Promise<LatestTransactionData[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...(mentorId ? { course: { mentorId } } : {}),
      },
      take: limit,
      orderBy: {
        transactionDate: 'desc',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseImages: {
              select: {
                id: true,
                imagePath: true,
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.toTransactionResponseDtos(transactions);
  }

  private toTransactionResponseDtos(
    transactions: TransactionWithCourseAndStudent[],
  ): LatestTransactionData[] {
    return transactions.map((transaction) => ({
      id: transaction.id,
      orderId: transaction.orderId,
      amount: Number(transaction.amount),
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate,
      course: {
        id: transaction.course.id,
        title: transaction.course.title,
        image: transaction.course.courseImages[0]?.imagePath || null,
      },
      student: {
        id: transaction.student.id,
        name: transaction.student.name,
        email: transaction.student.email,
      },
    }));
  }

  async findLatestCourses(
    limit: number = 5,
    mentorId?: number,
  ): Promise<LatestCourseData[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        ...(mentorId ? { mentorId } : {}),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        courseImages: {
          select: {
            id: true,
            imagePath: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: 1,
        },
      },
    });

    return this.toCourseResponseDtos(courses);
  }

  private toCourseResponseDtos(
    courses: CourseWithSubject[],
  ): LatestCourseDto[] {
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      price: Number(course.price),
      status: course.status,
      totalLessons: course.totalLessons,
      createdAt: course.createdAt,
      image: course.courseImages?.[0]?.imagePath || null,
      subject: {
        id: course.subject.id,
        name: course.subject.name,
      },
    }));
  }

  async findLatestUsers(limit: number = 5): Promise<LatestUserDto[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        userProfile: {
          select: {
            avatar: true,
          },
        },
      },
    });

    return this.toUserResponseDtos(users);
  }

  private toUserResponseDtos(users: UserWithRole[]): LatestUserDto[] {
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      avatar: user.userProfile?.avatar || null,
      role: {
        id: user.role.id,
        name: user.role.name,
        key: user.role.key,
      },
    }));
  }
}
