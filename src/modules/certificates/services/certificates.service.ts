import { BadRequestException, Injectable } from '@nestjs/common';
import { CertificatesRepository } from '../repositories/certificates.repository';
import { PdfService } from 'src/common/services/pdf.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly certificatesRepository: CertificatesRepository,
    private readonly pdfService: PdfService,
  ) {}

  async generateCertificatePdf(
    certificateId: string,
    studentId: number,
  ): Promise<Buffer> {
    const enrollment =
      await this.certificatesRepository.findCertificateByIdAndStudentId(
        certificateId,
        studentId,
      );

    if (!enrollment) {
      throw new BadRequestException(
        'Certificate not found for the given student.',
      );
    }

    if (!enrollment.completedAt) {
      throw new BadRequestException(
        'Course not completed yet. Certificate cannot be generated.',
      );
    }

    const pdfBuffer = await this.pdfService.generateCertificate({
      studentName: enrollment.student.name,
      courseName: enrollment.course.title,
      completedAt: enrollment.completedAt,
      certificateId: enrollment.certificateId!,
    });

    return pdfBuffer;
  }
}
