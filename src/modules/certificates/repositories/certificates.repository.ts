import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CertificatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCertificateByIdAndStudentId(
    certificateId: string,
    studentId: number,
  ) {
    return this.prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        certificateId: certificateId,
      },
      include: {
        course: true,
        student: true,
      },
    });
  }
}
