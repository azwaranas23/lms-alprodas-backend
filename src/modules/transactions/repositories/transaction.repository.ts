import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTransactionData } from '../interfaces/transaction.interface';
import { Prisma, TransactionStatus } from '@prisma/client';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import {
  TransactionDetailResponseDto,
  TransactionListResponseDto,
} from '../dto/transaction-response.dto';
import {
  TransactionWithCourse,
  TransactionWithDetails,
} from '../types/transaction.types';

interface PaginatedTransactionsResponse {
  transactions: TransactionListResponseDto[];
  total: number;
  page: number;
  limit: number;
}
@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private transactionInclude = {
    course: {
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
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
            id: Prisma.SortOrder.asc,
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            userProfile: {
              select: {
                bio: true,
                avatar: true,
                gender: true,
                expertise: true,
                experienceYears: true,
                linkedinUrl: true,
                githubUrl: true,
              },
            },
          },
        },
      },
    },
    student: {
      select: {
        id: true,
        name: true,
        email: true,
        userProfile: {
          select: {
            bio: true,
            avatar: true,
            gender: true,
            expertise: true,
            experienceYears: true,
            linkedinUrl: true,
            githubUrl: true,
          },
        },
      },
    },
  };

  async create(data: CreateTransactionData) {
    return this.prisma.transaction.create({
      data: {
        ...data,
        grossAmount: data.amount,
        status: TransactionStatus.PENDING,
        currency: 'IDR',
      },
    });
  }

  private parseGrossAmount(amount: string): number {
    const parsed = parseFloat(amount);

    if (isNaN(parsed) || parsed < 0) {
      throw new BadRequestException('Invalid amount format');
    }

    return parsed;
  }

  async findByOrderId(orderId: string) {
    return this.prisma.transaction.findUnique({
      where: { orderId },
    });
  }

  async findByOrderIdWithRelations(orderId: string) {
    return this.prisma.transaction.findUnique({
      where: { orderId },
      include: {
        course: true,
        student: true,
      },
    });
  }

  async updateStatus(
    orderId: string,
    status: TransactionStatus,
    paidAt?: Date,
  ) {
    return this.prisma.transaction.update({
      where: { orderId },
      data: {
        status,
        paidAt: paidAt,
      },
    });
  }

  async updatePaymentDetails(
    orderId: string,
    status: TransactionStatus,
    paymentMethod: string,
    paidAt?: Date,
  ) {
    return this.prisma.transaction.update({
      where: { orderId },
      data: {
        status,
        paymentMethod,
        paidAt: paidAt,
      },
    });
  }

  async createPaymentNotification(data: {
    transactionId: number;
    orderId: string;
    transactionStatus: string;
    midtransTransactionId: string;
    statusCode: string;
    grossAmount: string;
    paymentType: string;
    transactionTime: string;
    settlementTime?: string;
    signatureKey?: string;
    rawNotification: Prisma.InputJsonValue;
  }) {
    return this.prisma.paymentNotification.create({
      data: {
        transactionId: data.transactionId,
        orderId: data.orderId,
        transactionStatus: data.transactionStatus,
        midtransTransactionId: data.midtransTransactionId,
        statusCode: data.statusCode,
        grossAmount: this.parseGrossAmount(data.grossAmount),
        paymentType: data.paymentType,
        transactionTime: new Date(data.transactionTime),
        settlementTime: data.settlementTime
          ? new Date(data.settlementTime)
          : null,
        signatureKey: data.signatureKey,
        rawNotification: data.rawNotification,
        isProcessed: true,
        processedAt: new Date(),
      },
    });
  }

  async findAll(
    query: QueryTransactionsDto,
  ): Promise<PaginatedTransactionsResponse> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        take: limit,
        skip,
        orderBy: { transactionDate: 'desc' },
        include: this.transactionInclude,
      }),
      this.prisma.transaction.count(),
    ]);

    const transactionDtos = this.toResponseListDtos(transactions);

    return {
      transactions: transactionDtos,
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<TransactionWithDetails | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: this.transactionInclude,
    });
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<TransactionWithDetails | null> {
    return this.prisma.transaction.findFirst({
      where: {
        id,
        studentId: userId,
      },
      include: this.transactionInclude,
    });
  }

  async findByIdAndMentorId(
    id: number,
    mentorId: number,
  ): Promise<TransactionWithDetails | null> {
    return this.prisma.transaction.findFirst({
      where: {
        id,
        course: {
          mentorId,
        },
      },
      include: this.transactionInclude,
    });
  }

  async findByUserId(
    userId: number,
    query: QueryTransactionsDto,
  ): Promise<PaginatedTransactionsResponse> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { studentId: userId },
        take: limit,
        skip,
        orderBy: { transactionDate: 'desc' },
        include: this.transactionInclude,
      }),
      this.prisma.transaction.count({
        where: { studentId: userId },
      }),
    ]);

    const transactionDtos = this.toResponseListDtos(transactions);

    return {
      transactions: transactionDtos,
      total,
      page,
      limit,
    };
  }

  toResponseListDtos(
    transactions: TransactionWithCourse[],
  ): TransactionListResponseDto[] {
    return transactions.map((transaction) =>
      this.toResponseListDto(transaction),
    );
  }

  toResponseListDto(
    transaction: TransactionWithCourse,
  ): TransactionListResponseDto {
    return {
      id: transaction.id,
      orderId: transaction.orderId,
      amount: Number(transaction.amount),
      basePrice: Number(transaction.basePrice),
      ppnAmount: Number(transaction.ppnAmount),
      ppnRate: Number(transaction.ppnRate),
      platformFee: Number(transaction.platformFee),
      platformFeeRate: Number(transaction.platformFeeRate),
      mentorNetAmount: Number(transaction.mentorNetAmount),
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      currency: transaction.currency,
      transactionDate: transaction.transactionDate,
      paidAt: transaction.paidAt,
      expiredAt: transaction.expiredAt,
      course: {
        id: transaction.course.id,
        title: transaction.course.title,
        image: transaction.course.courseImages[0]
          ? transaction.course.courseImages[0].imagePath
          : null,
        price: Number(transaction.course.price),
        subject: {
          id: transaction.course.subject.id,
          name: transaction.course.subject.name,
        },
        mentor: {
          id: transaction.course.mentor.id,
          name: transaction.course.mentor.name,
          email: transaction.course.mentor.email,
          profile: transaction.course.mentor.userProfile
            ? {
                bio: transaction.course.mentor.userProfile.bio || null,
                avatar: transaction.course.mentor.userProfile.avatar || null,
                gender: transaction.course.mentor.userProfile.gender || null,
                expertise:
                  transaction.course.mentor.userProfile.expertise || null,
                experienceYears:
                  transaction.course.mentor.userProfile.experienceYears || null,
                linkedinUrl:
                  transaction.course.mentor.userProfile.linkedinUrl || null,
                githubUrl:
                  transaction.course.mentor.userProfile.githubUrl || null,
              }
            : {
                bio: null,
                avatar: null,
                gender: null,
                expertise: null,
                experienceYears: null,
                linkedinUrl: null,
                githubUrl: null,
              },
        },
      },
      student: {
        id: transaction.student.id,
        name: transaction.student.name,
        email: transaction.student.email,
        profile: transaction.student.userProfile
          ? {
              bio: transaction.student.userProfile.bio || null,
              avatar: transaction.student.userProfile.avatar || null,
              gender: transaction.student.userProfile.gender || null,
              expertise: transaction.student.userProfile.expertise || null,
              experienceYears:
                transaction.student.userProfile.experienceYears || null,
              linkedinUrl: transaction.student.userProfile.linkedinUrl || null,
              githubUrl: transaction.student.userProfile.githubUrl || null,
            }
          : {
              bio: null,
              avatar: null,
              gender: null,
              expertise: null,
              experienceYears: null,
              linkedinUrl: null,
              githubUrl: null,
            },
      },
    };
  }

  toResponseDto(
    transaction: TransactionWithDetails,
  ): TransactionDetailResponseDto {
    return {
      id: transaction.id,
      orderId: transaction.orderId,
      amount: Number(transaction.amount),
      basePrice: Number(transaction.basePrice),
      ppnAmount: Number(transaction.ppnAmount),
      ppnRate: Number(transaction.ppnRate),
      platformFee: Number(transaction.platformFee),
      platformFeeRate: Number(transaction.platformFeeRate),
      mentorNetAmount: Number(transaction.mentorNetAmount),
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      snapToken: transaction.snapToken,
      snapRedirectUrl: transaction.snapRedirectUrl,
      grossAmount: Number(transaction.grossAmount),
      currency: transaction.currency,
      transactionDate: transaction.transactionDate,
      paidAt: transaction.paidAt,
      expiredAt: transaction.expiredAt,
      course: {
        id: transaction.course.id,
        title: transaction.course.title,
        description: transaction.course.description,
        price: Number(transaction.course.price),
        subject: {
          id: transaction.course.subject.id,
          name: transaction.course.subject.name,
        },
        mentor: {
          id: transaction.course.mentor.id,
          name: transaction.course.mentor.name,
          email: transaction.course.mentor.email,
          profile: transaction.course.mentor.userProfile
            ? {
                bio: transaction.course.mentor.userProfile.bio || null,
                avatar: transaction.course.mentor.userProfile.avatar || null,
                gender: transaction.course.mentor.userProfile.gender || null,
                expertise:
                  transaction.course.mentor.userProfile.expertise || null,
                experienceYears:
                  transaction.course.mentor.userProfile.experienceYears || null,
                linkedinUrl:
                  transaction.course.mentor.userProfile.linkedinUrl || null,
                githubUrl:
                  transaction.course.mentor.userProfile.githubUrl || null,
              }
            : {
                bio: null,
                avatar: null,
                gender: null,
                expertise: null,
                experienceYears: null,
                linkedinUrl: null,
                githubUrl: null,
              },
        },
      },
      student: {
        id: transaction.student.id,
        name: transaction.student.name,
        email: transaction.student.email,
        profile: transaction.student.userProfile
          ? {
              bio: transaction.student.userProfile.bio || null,
              avatar: transaction.student.userProfile.avatar || null,
              gender: transaction.student.userProfile.gender || null,
              expertise: transaction.student.userProfile.expertise || null,
              experienceYears:
                transaction.student.userProfile.experienceYears || null,
              linkedinUrl: transaction.student.userProfile.linkedinUrl || null,
              githubUrl: transaction.student.userProfile.githubUrl || null,
            }
          : {
              bio: null,
              avatar: null,
              gender: null,
              expertise: null,
              experienceYears: null,
              linkedinUrl: null,
              githubUrl: null,
            },
      },
    };
  }

  async findByMentorId(
    mentorId: number,
    query: QueryTransactionsDto,
  ): Promise<PaginatedTransactionsResponse> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          course: {
            mentorId,
          },
        },
        take: limit,
        skip,
        orderBy: { transactionDate: 'desc' },
        include: this.transactionInclude,
      }),
      this.prisma.transaction.count({
        where: {
          course: {
            mentorId,
          },
        },
      }),
    ]);

    const transactionDtos = this.toResponseListDtos(transactions);

    return {
      transactions: transactionDtos,
      total,
      page,
      limit,
    };
  }
}
