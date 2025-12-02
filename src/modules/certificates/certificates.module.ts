import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CertificatesController } from './controllers/certificates.controller';
import { CertificatesRepository } from './repositories/certificates.repository';
import { CertificatesService } from './services/certificates.service';
import { PdfService } from 'src/common/services/pdf.service';

@Module({
  imports: [AuthModule],
  controllers: [CertificatesController],
  providers: [CertificatesRepository, CertificatesService, PdfService],
})
export class CertificatesModule {}
