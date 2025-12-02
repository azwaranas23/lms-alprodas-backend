import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { MidtransService } from 'src/common/services/midtrans.service';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { CheckoutDto } from '../dto/checkout.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import {
  CheckoutResponseDto,
  TransactionDetailResponseDto,
  TransactionListResponseDto,
  WebhookResponseDto,
} from '../dto/transaction-response.dto';
import { CoursesRepository } from 'src/modules/courses/repositories/courses.repository';
import { TRANSACTION_CONSTANTS } from 'src/common/constants/app.constants';
import * as crypto from 'crypto';
import {
  hasErrorMessage,
  hasErrorResponse,
} from 'src/common/utils/prisma-error.util';
import { QueueService } from 'src/common/services/queue.service';
import { Prisma, TransactionStatus } from '@prisma/client';
import { MidtransNotification } from '../interfaces/midtrans.interface';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { el } from '@faker-js/faker';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import { PaginatedResponse } from 'src/common/interface/pagination.interface';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { TransactionWithDetails } from '../types/transaction.types';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly midtransService: MidtransService,
    private readonly courseRepository: CoursesRepository,
    private readonly queueService: QueueService,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  async checkout(
    user: UsersResponseDto,
    checkoutDto: CheckoutDto,
  ): Promise<BaseResponse<CheckoutResponseDto>> {
    const course = await this.courseRepository.findById(checkoutDto.course_id);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingEnrollment =
      await this.enrollmentRepository.findByUserAndCourse(user.id, course.id);

    if (existingEnrollment) {
      throw new BadRequestException('User already enrolled in this course');
    }

    const basePrice = Math.round(Number(course.price));
    const ppnAmount = Math.round(basePrice * TRANSACTION_CONSTANTS.PPN_RATE);
    const platformFee = Math.round(
      basePrice * TRANSACTION_CONSTANTS.PLATFORM_FEE_RATE,
    );

    const mentorNetAmount = basePrice - platformFee;
    const totalAmount = basePrice + ppnAmount;

    const orderId = `TRX-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const midtransParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      customer_details: {
        email: user.email,
        first_name: user.name,
      },
      item_details: [
        {
          id: course.id.toString(),
          price: basePrice,
          quantity: 1,
          name: course.title,
        },
        {
          id: 'ppn',
          price: ppnAmount,
          quantity: 1,
          name: 'PPN',
        },
      ],
      expiry: {
        start_time:
          new Date().toISOString().slice(0, 19).replace('T', ' ') +
          ` ${TRANSACTION_CONSTANTS.TIMEZONE}`,
        duration: TRANSACTION_CONSTANTS.EXPIRY_DURATION_MINUTES,
        unit: 'minutes',
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment-success/${course.id}`,
        error: `${process.env.FRONTEND_URL}/payment-failed`,
        pending: `${process.env.FRONTEND_URL}/payment-pending`,
      },
    };

    const expiresAt = new Date();
    let expiryDelayMs: number;

    if (checkoutDto.test_expiry_seconds) {
      expiresAt.setSeconds(
        expiresAt.getSeconds() + checkoutDto.test_expiry_seconds,
      );
      expiryDelayMs = checkoutDto.test_expiry_seconds * 1000;
      this.logger.log(
        `Test expiry set to ${checkoutDto.test_expiry_seconds} seconds`,
      );
    } else {
      expiresAt.setHours(
        expiresAt.getHours() + TRANSACTION_CONSTANTS.EXPIRY_DURATION_HOURS,
      );

      expiryDelayMs =
        TRANSACTION_CONSTANTS.EXPIRY_DURATION_HOURS * 60 * 60 * 1000;
    }

    try {
      const midtransResponse =
        await this.midtransService.createTransaction(midtransParams);

      const transaction = await this.transactionRepository.create({
        studentId: user.id,
        courseId: course.id,
        amount: totalAmount,
        basePrice: basePrice,
        ppnAmount: ppnAmount,
        ppnRate: TRANSACTION_CONSTANTS.PPN_RATE,
        orderId: orderId,
        snapToken: midtransResponse.token,
        snapRedirectUrl: midtransResponse.redirect_url,
        platformFee: platformFee,
        mentorNetAmount: mentorNetAmount,
        platformFeeRate: TRANSACTION_CONSTANTS.PLATFORM_FEE_RATE,
        expiredAt: expiresAt,
      });

      await this.queueService.addTransactionExpiryJob(
        {
          orderId: transaction.orderId,
          transactionId: transaction.id,
        },
        expiryDelayMs,
      );

      await this.queueService.addEmailJob({
        to: user.email,
        subject: `Payment Instructions for ${course.title}`,
        template: 'transaction',
        templateData: {
          orderId,
          courseName: course.title,
          basePrice: basePrice.toLocaleString('id-ID'),
          ppnAmount: ppnAmount.toLocaleString('id-ID'),
          totalAmount: totalAmount.toLocaleString('id-ID'),
          paymentUrl: midtransResponse.redirect_url,
        },
      });

      return {
        message: 'Checkout initiated successfully',
        data: {
          orderId,
          snapToken: midtransResponse.token,
          redirectUrl: midtransResponse.redirect_url,
          basePrice,
          ppnAmount,
          totalAmount,
          currency: 'IDR',
          status: TransactionStatus.PENDING,
          expiresAt: expiresAt,
          platformFee,
          mentorNetAmount,
          course: {
            id: course.id,
            title: course.title,
            price: basePrice,
          },
          customer: {
            name: user.name,
            email: user.email,
          },
        },
      };
    } catch (error) {
      this.logger.error('Midtrans transaction error', error);

      if (hasErrorResponse(error)) {
        throw new BadRequestException(
          `Payment gateway error: ${error.response.data.error_messages?.join(', ')}`,
        );
      }

      if (hasErrorMessage(error)) {
        throw new BadRequestException(
          `Payment gateway error: ${error.message}`,
        );
      }

      throw new BadRequestException('Payment gateway error');
    }
  }

  async handlePaymentNotification(
    notification: MidtransNotification,
  ): Promise<BaseResponse<WebhookResponseDto>> {
    const {
      order_id,
      transaction_status,
      transaction_id,
      payment_type,
      transaction_time,
      settlement_time,
      gross_amount,
      status_code,
      signature_key,
    } = notification;

    const transaction =
      await this.transactionRepository.findByOrderId(order_id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    let transactionStatus: TransactionStatus;
    let paidAt: Date | undefined;

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        transactionStatus = TransactionStatus.PAID;
        paidAt = settlement_time ? new Date(settlement_time) : new Date();

        const existingEnrollment =
          await this.enrollmentRepository.findByUserAndCourse(
            transaction.studentId,
            transaction.courseId,
          );

        if (!existingEnrollment) {
          await this.enrollmentRepository.create(
            transaction.studentId,
            transaction.courseId,
          );

          await this.courseRepository.updateCourseStudentCount(
            transaction.courseId,
          );

          const transactionWithUser =
            await this.transactionRepository.findByOrderIdWithRelations(
              order_id,
            );

          if (transactionWithUser) {
            await this.queueService.addEmailJob({
              to: transactionWithUser.student.email,
              subject: `Enrollment Confirmation for ${transactionWithUser.course.title}`,
              template: 'payment-success',
              templateData: {
                name: transactionWithUser.student.name,
                courseName: transactionWithUser.course.title,
                orderId: order_id,
                amount: Number(gross_amount).toLocaleString('id-ID'),
                paymentMethod: payment_type,
              },
            });
          }
        } else {
          this.logger.log(
            `User ${transaction.studentId} already enrolled in course ${transaction.courseId}`,
          );
        }

        break;
      case 'pending':
        transactionStatus = TransactionStatus.PENDING;
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        transactionStatus = TransactionStatus.EXPIRED;
        break;
      case 'refund':
        transactionStatus = TransactionStatus.REFUNDED;
        break;
      default:
        transactionStatus = TransactionStatus.PENDING;
    }

    await this.transactionRepository.updatePaymentDetails(
      order_id,
      transactionStatus,
      payment_type,
      paidAt,
    );

    await this.transactionRepository.createPaymentNotification({
      transactionId: transaction.id,
      orderId: order_id,
      transactionStatus: transaction_status,
      midtransTransactionId: transaction_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      paymentType: payment_type || 'unknown',
      transactionTime: transaction_time,
      settlementTime: settlement_time,
      signatureKey: signature_key,
      rawNotification: notification as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(
      `Transaction ${order_id} updated to status ${transactionStatus}`,
    );

    return {
      message: 'Payment notification processed successfully',
      data: {
        success: true,
      },
    };
  }

  async getTransactions(
    user: UsersResponseDto,
    query: QueryTransactionsDto,
  ): Promise<BaseResponse<PaginatedResponse<TransactionListResponseDto>>> {
    let result: {
      transactions: TransactionListResponseDto[];
      total: number;
      page: number;
      limit: number;
    };

    if (user.role.key === UserRole.MANAGER) {
      result = await this.transactionRepository.findAll(query);
    } else {
      result = await this.transactionRepository.findByUserId(user.id, query);
    }

    const { transactions, total, page, limit } = result;

    const paginatedResponse = PaginationUtil.createResponse(
      transactions,
      page,
      limit,
      total,
    );

    return {
      message: 'Transactions retrieved successfully',
      data: paginatedResponse,
    };
  }

  async getDetailTransaction(
    user: UsersResponseDto,
    transactionId: number,
  ): Promise<BaseResponse<TransactionDetailResponseDto>> {
    let transaction: TransactionWithDetails | null;

    if (user.role.key === UserRole.MANAGER) {
      transaction = await this.transactionRepository.findById(transactionId);
    } else if (user.role.key === UserRole.MENTOR) {
      transaction = await this.transactionRepository.findByIdAndMentorId(
        transactionId,
        user.id,
      );
    } else {
      transaction = await this.transactionRepository.findByIdAndUserId(
        transactionId,
        user.id,
      );
    }

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const transactionDto =
      this.transactionRepository.toResponseDto(transaction);

    return {
      message: 'Transaction detail retrieved successfully',
      data: transactionDto,
    };
  }

  async getMentorTransactions(
    user: UsersResponseDto,
    query: QueryTransactionsDto,
  ): Promise<BaseResponse<PaginatedResponse<TransactionListResponseDto>>> {
    if (user.role.key !== UserRole.MENTOR) {
      throw new ForbiddenException('Access denied');
    }

    const result = await this.transactionRepository.findByMentorId(
      user.id,
      query,
    );

    const { transactions, total, page, limit } = result;

    const paginatedResponse = PaginationUtil.createResponse(
      transactions,
      page,
      limit,
      total,
    );

    return {
      message: 'Transactions retrieved successfully',
      data: paginatedResponse,
    };
  }
}
