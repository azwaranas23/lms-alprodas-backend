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
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  LatestCourseDto,
  LatestUserDto,
} from '../dto/latest-data-response.dto';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) { }

  /** ============= MENTOR DASHBOARD ============= */
  async getMentorStatistics(mentorId: number): Promise<DashboardStatistics> {
    const [studentsResult, coursesResult, lessonsResult, enrollmentsResult] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: { key: UserRole.STUDENT },
          enrollments: { some: { course: { mentorId } } },
        },
      }),
      this.prisma.course.count({ where: { mentorId } }),
      this.prisma.lesson.count({
        where: { section: { course: { mentorId } } },
      }),
      // Count all enrollments in mentor's courses
      this.prisma.enrollment.count({
        where: { course: { mentorId } },
      }),
    ]);

    return {
      totalRevenue: 0, // transaksi sudah dihapus
      totalTransactions: enrollmentsResult, // now uses enrollment count
      totalStudents: studentsResult,
      totalCourses: coursesResult,
      totalLessons: lessonsResult,
      totalWithdrawals: 0, // withdrawal sudah dihapus
    };
  }

  /** ============= ADMIN DASHBOARD ============= */
  async getAdminStatistics(): Promise<DashboardStatistics> {
    const [studentsResult, coursesResult, lessonsResult] = await Promise.all([
      this.prisma.user.count({ where: { role: { key: UserRole.STUDENT } } }),
      this.prisma.course.count(),
      this.prisma.lesson.count({ where: { isActive: true } }),
    ]);

    return {
      totalRevenue: 0,
      totalTransactions: 0,
      totalStudents: studentsResult,
      totalCourses: coursesResult,
      totalLessons: lessonsResult,
      totalWithdrawals: 0,
    };
  }

  /** ============= LATEST TRANSACTIONS (Mocked) ============= */
  async findLatestTransaction(
    limit: number = 5,
    mentorId?: number,
  ): Promise<LatestTransactionData[]> {
    // Karena modul transaksi tidak ada, return array kosong
    return [];
  }

  private toTransactionResponseDtos(
    transactions: TransactionWithCourseAndStudent[],
  ): LatestTransactionData[] {
    return []; // tidak digunakan lagi
  }

  /** ============= LATEST COURSES ============= */
  async findLatestCourses(
    limit: number = 5,
    mentorId?: number,
  ): Promise<LatestCourseData[]> {
    const courses = await this.prisma.course.findMany({
      where: mentorId ? { mentorId } : {},
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        courseImages: {
          select: { id: true, imagePath: true },
          orderBy: { id: 'asc' },
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

  /** ============= LATEST USERS ============= */
  async findLatestUsers(limit: number = 5): Promise<LatestUserDto[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        role: { select: { id: true, name: true, key: true } },
        userProfile: { select: { avatar: true } },
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
