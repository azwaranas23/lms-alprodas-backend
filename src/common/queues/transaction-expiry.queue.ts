import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { Job } from 'bull';
import { TransactionRepository } from 'src/modules/transactions/repositories/transaction.repository';

export interface TransactionExpiryJobData {
  orderId: string;
  transactionId: number;
}

@Processor('transaction-expiry')
export class TransactionExpiryQueue {
  private readonly logger = new Logger(TransactionExpiryQueue.name);

  constructor(private readonly transactionRepository: TransactionRepository) {}

  @Process('expire-transaction')
  async handleExpireTransaction(job: Job<TransactionExpiryJobData>) {
    this.logger.log(
      `Processing transaction expiry job ${job.id} for orderId ${job.data.orderId}`,
    );

    try {
      const { orderId } = job.data;

      const transaction =
        await this.transactionRepository.findByOrderId(orderId);

      if (!transaction) {
        this.logger.warn(`Transaction with orderId ${orderId} not found`);
        return;
      }

      if (transaction.status === TransactionStatus.PENDING) {
        await this.transactionRepository.updatePaymentDetails(
          orderId,
          TransactionStatus.EXPIRED,
          transaction.paymentMethod || 'unknown',
          undefined,
        );
        this.logger.log(
          `Transaction with orderId ${orderId} marked as EXPIRED`,
        );
      } else {
        this.logger.log(`Transaction with orderId ${orderId} is not pending`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process transaction expiry job ${job.id}:`,
        error,
      );
      throw error;
    }
  }
}
