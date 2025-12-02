import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { WithdrawalsService } from '../services/withdrawals.service';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { WithdrawalsResponseDto } from '../dto/withdrawals-response.dto';
import { QueryWithdrawalsDto } from '../dto/query-withdrawals.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { WithdrawalBalance } from '../interfaces/withdrawal-balance.interface';
import { ValidatePasswordDto } from '../dto/validate-password.dto';
import { CheckBalanceDto } from '../dto/check-balance.dto';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UpdateWithdrawalStatusDto } from '../dto/update-withdrawal-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Controller('withdrawals')
@UseGuards(PermissionsGuard)
export class WithdrawalsController {
  constructor(
    private readonly withdrawalsService: WithdrawalsService,
    private fileUploadService: FileUploadService,
  ) {}

  @Get('all')
  @Permissions('withdrawals.read')
  async getAllWithdrawals(
    @Query() query: QueryWithdrawalsDto,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<PaginatedResponse<WithdrawalsResponseDto>>> {
    if (user?.role?.key !== UserRole.MANAGER) {
      throw new ForbiddenException('Access denied');
    }

    return this.withdrawalsService.getWithdrawals(query);
  }

  @Get('my-withdrawals')
  @Permissions('withdrawals.read')
  async getMyWithdrawals(
    @Query() query: QueryWithdrawalsDto,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<PaginatedResponse<WithdrawalsResponseDto>>> {
    if (user?.role?.key !== UserRole.MENTOR) {
      throw new ForbiddenException('Access denied');
    }

    return this.withdrawalsService.getWithdrawals(query, user);
  }

  @Get('balance')
  @Permissions('withdrawals.read')
  async getWithdrawalBalance(
    @CurrentUser() user: UsersResponseDto,
  ): Promise<BaseResponse<WithdrawalBalance>> {
    return this.withdrawalsService.getWithdrawalBalance(user);
  }

  @Post('validate-password')
  @Permissions('withdrawals.create')
  async validatePassword(
    @CurrentUser() user: UsersResponseDto,
    @Body() dto: ValidatePasswordDto,
  ): Promise<BaseResponse<{ isValid: boolean }>> {
    return this.withdrawalsService.validatePassword(user.id, dto);
  }

  @Post('check-balance')
  @Permissions('withdrawals.create')
  async checkBalance(
    @CurrentUser() user: UsersResponseDto,
    @Body() dto: CheckBalanceDto,
  ): Promise<BaseResponse<{ canWithdraw: boolean; availableBalance: number }>> {
    return this.withdrawalsService.checkBalance(user, dto);
  }

  @Post()
  @Permissions('withdrawals.create')
  async createWithdrawal(
    @CurrentUser() user: UsersResponseDto,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    return this.withdrawalsService.createWithdrawal(user.id, dto);
  }

  @Get(':id')
  @Permissions('withdrawals.read')
  async getWithdrawalById(
    @CurrentUser() user: UsersResponseDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    return this.withdrawalsService.getWithdrawalById(id, user);
  }

  @Patch(':id/status')
  @Permissions('withdrawals.update')
  @UseInterceptors(
    FileInterceptor(
      'proofPaymentFile',
      FileUploadService.getMulterConfig({
        destination: './uploads/withdrawals',
        allowedTypes: /\.(jpg|jpeg|png|pdf)$/,
        allowedTypesMessage: 'Only JPG, JPEG, PNG, and PDF files are allowed!',
      }),
    ),
  )
  async updateWithdrawalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWithdrawalStatusDto,
    @CurrentUser() user: UsersResponseDto,
    @UploadedFile() proofPaymentFile?: Express.Multer.File,
  ): Promise<BaseResponse<WithdrawalsResponseDto>> {
    const imageUrl = proofPaymentFile
      ? this.fileUploadService.getFileUrl(
          proofPaymentFile.filename,
          'uploads/withdrawals',
        )
      : undefined;
    return this.withdrawalsService.updateWithdrawalStatus(
      id,
      dto,
      user,
      imageUrl,
    );
  }
}
