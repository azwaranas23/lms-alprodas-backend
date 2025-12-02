import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { EmailJobData } from '../queues/email.queue';
import { TransactionExpiryJobData } from '../queues/transaction-expiry.queue';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue<EmailJobData>,
    @InjectQueue('transaction-expiry')
    private transactionExpiryQueue: Queue<TransactionExpiryJobData>,
  ) {}

  async addEmailJob(
    jobData: EmailJobData,
    options?: JobOptions,
  ): Promise<void> {
    try {
      const jobOptions: JobOptions = {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        delay: options?.delay || 0,
        ...options,
      };

      const job = await this.emailQueue.add('send', jobData, jobOptions);
      this.logger.log(`Added email job ${job.id} to the queue`);
    } catch (error) {
      this.logger.error('Failed to add email job to the queue:', error);
      throw error;
    }
  }

  async sendEmailViaQueue(): Promise<void> {
    await this.addEmailJob({
      to: 'recipient@example.com',
      subject: 'Test Email',
      template: 'test',
      templateData: {
        name: 'John Doe',
        timestamp: new Date().toISOString(),
      },
    });
  }

  async addTransactionExpiryJob(
    data: TransactionExpiryJobData,
    delayMs: number,
  ): Promise<void> {
    try {
      const job = await this.transactionExpiryQueue.add(
        'expire-transaction',
        data,
        {
          delay: delayMs,
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
        },
      );

      this.logger.log(
        `Added transaction expiry job ${job.id} for orderId ${data.orderId} to the queue with ${delayMs}ms delay`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to add transaction expiry job to the queue:',
        error,
      );
      throw error;
    }
  }
}
