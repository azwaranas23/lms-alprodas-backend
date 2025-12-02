import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { WithdrawalsResponseDto } from '../dto/withdrawals-response.dto';
import { QueryWithdrawalsDto } from '../dto/query-withdrawals.dto';
import {
  Prisma,
  TransactionStatus,
  Withdrawal,
  WithdrawalStatus,
} from '@prisma/client';
import { WithdrawalWithRelations } from '../types/withdrawal.types';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UpdateWithdrawalStatusDto } from '../dto/update-withdrawal-status.dto';

interface PaginatedWithdrawalsResponse {
  withdrawals: WithdrawalWithRelations[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class WithdrawalsRepository {
  private readonly withdrawalInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        userProfile: {
          select: {
            avatar: true,
            expertise: true,
            bio: true,
          },
        },
      },
    },
    processedByUser: {
      select: {
        id: true,
        name: true,
        email: true,
        userProfile: {
          select: {
            avatar: true,
            expertise: true,
            bio: true,
          },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryWithdrawalsDto,
    userId?: number,
  ): Promise<PaginatedWithdrawalsResponse> {
    const { page = 1, limit = 10, status } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.WithdrawalWhereInput = status ? { status } : {};

    if (userId) {
      where.userId = userId;
    }

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: this.withdrawalInclude,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      withdrawals,
      total,
      page,
      limit,
    };
  }

  toResponseDto(withdrawal: WithdrawalWithRelations): WithdrawalsResponseDto {
    return {
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: Number(withdrawal.amount),
      status: withdrawal.status,
      withdrawalCode: withdrawal.withdrawalCode,
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountHolderName: withdrawal.accountHolderName,
      processedBy: withdrawal.processedBy || null,
      proofPaymentWithdrawal: withdrawal.proofPaymentWithdrawal || null,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt || null,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      user: withdrawal.user
        ? {
            id: withdrawal.user.id,
            name: withdrawal.user.name,
            email: withdrawal.user.email,
            avatar: withdrawal.user.userProfile?.avatar || null,
            expertise: withdrawal.user.userProfile?.expertise || null,
            bio: withdrawal.user.userProfile?.bio || null,
          }
        : null,
      processedByUser: withdrawal.processedByUser
        ? {
            id: withdrawal.processedByUser.id,
            name: withdrawal.processedByUser.name,
            email: withdrawal.processedByUser.email,
            avatar: withdrawal.processedByUser.userProfile?.avatar || null,
            expertise:
              withdrawal.processedByUser.userProfile?.expertise || null,
            bio: withdrawal.processedByUser.userProfile?.bio || null,
          }
        : null,
    };
  }

  toResponseDtos(
    withdrawals: WithdrawalWithRelations[],
  ): WithdrawalsResponseDto[] {
    return withdrawals.map((withdrawal) => this.toResponseDto(withdrawal));
  }

  async getTotalWithdrawnByUserId(
    userId: number,
    status?: WithdrawalStatus[],
  ): Promise<number> {
    const result = await this.prisma.withdrawal.aggregate({
      where: { userId, status: status ? { in: status } : undefined },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getPendingWithdrawalsByUserId(userId: number): Promise<number> {
    const result = await this.prisma.withdrawal.aggregate({
      where: {
        userId,
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getTotalEarningsByMentorId(mentorId: number): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        course: { mentorId },
        status: TransactionStatus.PAID,
      },
      _sum: {
        mentorNetAmount: true,
      },
    });

    return result._sum.mentorNetAmount
      ? Number(result._sum.mentorNetAmount)
      : 0;
  }

  async getWithdrawalCountByStatus(
    userId: number,
    status: WithdrawalStatus | WithdrawalStatus[],
  ): Promise<number> {
    return this.prisma.withdrawal.count({
      where: {
        userId,
        status: Array.isArray(status) ? { in: status } : status,
      },
    });
  }

  async getAllMentorsTotalEarnings(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.PAID,
        course: {
          mentor: {
            role: {
              key: UserRole.MENTOR,
            },
          },
        },
      },
      _sum: {
        basePrice: true,
      },
    });

    return result._sum.basePrice ? Number(result._sum.basePrice) : 0;
  }

  async getAllMentorsTotalWithdrawn(
    status?: WithdrawalStatus[],
  ): Promise<number> {
    const result = await this.prisma.withdrawal.aggregate({
      where: {
        status: status ? { in: status } : undefined,
        user: {
          role: {
            key: UserRole.MENTOR,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getAllMentorsPendingWithdrawals(): Promise<number> {
    const result = await this.prisma.withdrawal.aggregate({
      where: {
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
        user: {
          role: {
            key: UserRole.MENTOR,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getAllMentorsWithdrawalCountByStatus(
    status: WithdrawalStatus | WithdrawalStatus[],
  ): Promise<number> {
    return this.prisma.withdrawal.count({
      where: {
        status: Array.isArray(status) ? { in: status } : status,
        user: {
          role: {
            key: UserRole.MENTOR,
          },
        },
      },
    });
  }

  async create(data: Prisma.WithdrawalCreateInput): Promise<Withdrawal> {
    return this.prisma.withdrawal.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async checkDuplicatePendingWithdrawal(
    userId: number,
    amount: number,
  ): Promise<boolean> {
    const count = await this.prisma.withdrawal.count({
      where: {
        userId,
        amount,
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
      },
    });
    return count > 0;
  }

  async findById(id: number): Promise<WithdrawalWithRelations | null> {
    return this.prisma.withdrawal.findUnique({
      where: { id },
      include: this.withdrawalInclude,
    });
  }

  async update(
    id: number,
    data: UpdateWithdrawalStatusDto,
  ): Promise<Withdrawal> {
    return this.prisma.withdrawal.update({
      where: { id },
      data,
      include: this.withdrawalInclude,
    });
  }
}
