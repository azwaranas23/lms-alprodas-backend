import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from '../services/email.service';
import { EmailProcessor } from '../queues/email.queue';
import { QueueService } from '../services/queue.service';

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
  providers: [EmailService, EmailProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
