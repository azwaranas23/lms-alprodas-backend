import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { CheckoutDto } from '../dto/checkout.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import {
  CheckoutResponseDto,
  TransactionDetailResponseDto,
  TransactionListResponseDto,
  WebhookResponseDto,
} from '../dto/transaction-response.dto';
import { MidtransNotification } from '../interfaces/midtrans.interface';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { Throttle } from '@nestjs/throttler';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Throttle({ default: { ttl: 5000, limit: 1 } }) // 1 request per 5 seconds
  @Post('checkout')
  @UseGuards(PermissionsGuard)
  @Permissions('transactions.create')
  async checkout(
    @CurrentUser() user: UsersResponseDto,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<BaseResponse<CheckoutResponseDto>> {
    return this.transactionService.checkout(user, checkoutDto);
  }

  @Post('webhook/midtrans')
  async handleMidtransWebhook(
    @Body() data: MidtransNotification,
  ): Promise<BaseResponse<WebhookResponseDto>> {
    return this.transactionService.handlePaymentNotification(data);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('transactions.read')
  async getTransactions(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryTransactionsDto,
  ): Promise<BaseResponse<PaginatedResponse<TransactionListResponseDto>>> {
    return this.transactionService.getTransactions(user, query);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('transactions.read')
  async getTransactionById(
    @CurrentUser() user: UsersResponseDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponse<TransactionDetailResponseDto>> {
    return this.transactionService.getDetailTransaction(user, id);
  }

  @Get('mentor/list')
  @UseGuards(PermissionsGuard)
  @Permissions('transactions.read')
  async getMentorTransactions(
    @CurrentUser() user: UsersResponseDto,
    @Query() query: QueryTransactionsDto,
  ): Promise<BaseResponse<PaginatedResponse<TransactionListResponseDto>>> {
    return this.transactionService.getMentorTransactions(user, query);
  }
}
