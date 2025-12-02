import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WithdrawalsController } from './controllers/withdrawals.controller';
import { WithdrawalsService } from './services/withdrawals.service';
import { WithdrawalsRepository } from './repositories/withdrawals.repository';
import { UsersRepository } from '../users/repositories/users.repositories';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Module({
  imports: [AuthModule],
  controllers: [WithdrawalsController],
  providers: [
    WithdrawalsService,
    WithdrawalsRepository,
    UsersRepository,
    FileUploadService,
  ],
  exports: [],
})
export class WithdrawalsModule {}
