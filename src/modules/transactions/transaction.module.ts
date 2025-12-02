import { Module } from '@nestjs/common';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from 'src/common/modules/queue.module';
import { CoursesRepository } from '../courses/repositories/courses.repository';
import { MidtransService } from 'src/common/services/midtrans.service';
import { EnrollmentRepository } from './repositories/enrollment.repository';

@Module({
  imports: [AuthModule, QueueModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionRepository,
    CoursesRepository,
    MidtransService,
    EnrollmentRepository,
  ],
  exports: [],
})
export class TransactionModule {}
