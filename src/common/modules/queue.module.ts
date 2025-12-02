import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from '../services/email.service';
import { EmailProcessor } from '../queues/email.queue';
import { QueueService } from '../services/queue.service';
import { TransactionExpiryQueue } from '../queues/transaction-expiry.queue';
import { TransactionRepository } from 'src/modules/transactions/repositories/transaction.repository';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'transaction-expiry',
    }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    QueueService,
    TransactionExpiryQueue,
    TransactionRepository,
  ],
  exports: [QueueService],
})
export class QueueModule {}
