import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WithdrawalsRepository } from '../repositories/withdrawals.repository';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { WithdrawalsResponseDto } from '../dto/withdrawals-response.dto';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { UserRole } from 'src/common/enums/user-role.enum';
import { WithdrawalBalance } from '../interfaces/withdrawal-balance.interface';
import { WithdrawalStatus } from '@prisma/client';
import { ValidatePasswordDto } from '../dto/validate-password.dto';
import { UsersRepository } from 'src/modules/users/repositories/users.repositories';
import * as bcrypt from 'bcrypt';
import { CheckBalanceDto } from '../dto/check-balance.dto';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UserWithRoleAndPermissions } from 'src/modules/users/types/users.types';
import { UpdateWithdrawalStatusDto } from '../dto/update-withdrawal-status.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly withdrawalsRepository: WithdrawalsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getWithdrawals(
    query,
    user?: UsersResponseDto,
  ): Promise<BaseResponse<PaginatedResponse<WithdrawalsResponseDto>>> {
    const userId = user?.role?.key === UserRole.MENTOR ? user.id : undefined;

    const { withdrawals, total, page, limit } =
      await this.withdrawalsRepository.findAll(query, userId);

    const withdrawalsDto =
      this.withdrawalsRepository.toResponseDtos(withdrawals);

    const paginatedResponse = PaginationUtil.createResponse(
      withdrawalsDto,
      page,
      limit,
      total,
    );

    return {
      message: 'Withdrawals retrieved successfully',
      data: paginatedResponse,
    };
  }

  async getWithdrawalBalance(
    user: UsersResponseDto,
  ): Promise<BaseResponse<WithdrawalBalance>> {
    let totalEarnings: number = 0;
    let totalWithdrawn: number = 0;
    let pendingWithdrawals: number = 0;
    let totalPendingCount: number = 0;
    let totalSuccessCount: number = 0;

    if (
      user.role?.key !== UserRole.MENTOR &&
      user.role?.key !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role?.key === UserRole.MANAGER) {
      const [earnings, withdrawn, pending, pendingCount, successCount] =
        await Promise.all([
          this.withdrawalsRepository.getAllMentorsTotalEarnings(),
          this.withdrawalsRepository.getAllMentorsTotalWithdrawn([
            WithdrawalStatus.COMPLETED,
          ]),
          this.withdrawalsRepository.getAllMentorsPendingWithdrawals(),
          this.withdrawalsRepository.getAllMentorsWithdrawalCountByStatus([
            WithdrawalStatus.PENDING,
            WithdrawalStatus.PROCESSING,
          ]),
          this.withdrawalsRepository.getAllMentorsWithdrawalCountByStatus([
            WithdrawalStatus.COMPLETED,
          ]),
        ]);

      totalEarnings = earnings;
      totalWithdrawn = withdrawn;
      pendingWithdrawals = pending;
      totalPendingCount = pendingCount;
      totalSuccessCount = successCount;
    }

    if (user.role?.key === UserRole.MENTOR) {
      const [earnings, withdrawn, pending, pendingCount, successCount] =
        await Promise.all([
          this.withdrawalsRepository.getTotalEarningsByMentorId(user.id),
          this.withdrawalsRepository.getTotalWithdrawnByUserId(user.id, [
            WithdrawalStatus.COMPLETED,
          ]),
          this.withdrawalsRepository.getPendingWithdrawalsByUserId(user.id),
          this.withdrawalsRepository.getWithdrawalCountByStatus(user.id, [
            WithdrawalStatus.PENDING,
            WithdrawalStatus.PROCESSING,
          ]),
          this.withdrawalsRepository.getWithdrawalCountByStatus(user.id, [
            WithdrawalStatus.COMPLETED,
          ]),
        ]);
      totalEarnings = earnings;
      totalWithdrawn = withdrawn;
      pendingWithdrawals = pending;
      totalPendingCount = pendingCount;
      totalSuccessCount = successCount;
    }

    const availableBalance =
      totalEarnings - totalWithdrawn - pendingWithdrawals;

    return {
      message: 'Withdrawal balance retrieved successfully',
      data: {
        totalEarnings,
        totalWithdrawn,
        availableBalance,
        pendingWithdrawals,
        totalPendingCount,
        totalSuccessCount,
      },
    };
  }

  async validatePassword(
    userId: number,
    dto: ValidatePasswordDto,
  ): Promise<BaseResponse<{ isValid: boolean }>> {
    const user = await this.usersRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      message: 'Password is valid',
      data: { isValid: true },
    };
  }

  async checkBalance(
    user: UsersResponseDto,
    dto: CheckBalanceDto,
  ): Promise<BaseResponse<{ canWithdraw: boolean; availableBalance: number }>> {
    const balanceResponse = await this.getWithdrawalBalance(user);
    const balance = balanceResponse.data;

    if (!balance) {
      throw new NotFoundException('Balance not found');
    }

    if (dto.amount > balance.availableBalance) {
      throw new BadRequestException(
        'Insufficient balance for this withdrawal amount',
      );
    }

    return {
      message: 'Sufficient balance for withdrawal',
      data: { canWithdraw: true, availableBalance: balance.availableBalance },
    };
  }

  async createWithdrawal(
    userId: number,
    dto: CreateWithdrawalDto,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role?.key !== UserRole.MENTOR) {
      throw new ForbiddenException('Only mentors can create withdrawals');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const balanceResponse = await this.getWithdrawalBalance(
      user as unknown as UsersResponseDto,
    );
    const balance = balanceResponse.data;

    if (!balance) {
      throw new BadRequestException('Insufficient balance');
    }

    if (dto.amount > balance.availableBalance) {
      throw new BadRequestException(
        'Insufficient balance for this withdrawal amount',
      );
    }

    const isDuplicate =
      await this.withdrawalsRepository.checkDuplicatePendingWithdrawal(
        userId,
        dto.amount,
      );

    if (isDuplicate) {
      throw new ConflictException(
        'You already have a pending withdrawal request with same amount',
      );
    }

    const withdrawal = await this.withdrawalsRepository.create({
      user: { connect: { id: userId } },
      amount: dto.amount,
      bankName: dto.bank_name,
      accountNumber: dto.account_number,
      accountHolderName: dto.account_holder_name,
      status: WithdrawalStatus.PENDING,
      withdrawalCode: `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });

    return {
      message: 'Withdrawal request created successfully',
      data: this.withdrawalsRepository.toResponseDto(withdrawal),
    };
  }

  async getWithdrawalById(
    id: number,
    user: UsersResponseDto,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    const withdrawal = await this.withdrawalsRepository.findById(id);

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (user.role?.key !== UserRole.MANAGER && withdrawal.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return {
      message: 'Withdrawal retrieved successfully',
      data: this.withdrawalsRepository.toResponseDto(withdrawal),
    };
  }

  async updateWithdrawalStatus(
    id: number,
    dto: UpdateWithdrawalStatusDto,
    userProcessed: UsersResponseDto,
    proofPaymentFile?: string,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    if (userProcessed.role?.key !== UserRole.MANAGER) {
      throw new ForbiddenException(
        'Only managers can update withdrawal status',
      );
    }

    const withdrawal = await this.withdrawalsRepository.findById(id);

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (
      withdrawal.status === WithdrawalStatus.COMPLETED ||
      withdrawal.status === WithdrawalStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Cannot update a completed or rejected withdrawal',
      );
    }

    const updateData = {
      status: dto.status,
      processedByUser: { connect: { id: userProcessed.id } },
      processedAt: new Date(),
      proofPaymentWithdrawal: proofPaymentFile,
    };

    const updatedWithdrawal = await this.withdrawalsRepository.update(
      id,
      updateData,
    );

    return {
      message: 'Withdrawal status updated successfully',
      data: this.withdrawalsRepository.toResponseDto(updatedWithdrawal),
    };
  }
}
