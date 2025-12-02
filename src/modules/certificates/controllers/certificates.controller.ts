import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { CertificatesService } from '../services/certificates.service';
import { Response } from 'express';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';
import { PermissionsGuard } from 'src/modules/auth/guards/permision.guard';

@Controller('certificates')
@UseGuards(PermissionsGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':certificatedId/download')
  async downloadCertificate(
    @Param('certificatedId') certificateId: string,
    @Res() res: Response,
    @CurrentUser() user: UsersResponseDto,
  ): Promise<void> {
    const pdfBuffer = await this.certificatesService.generateCertificatePdf(
      certificateId,
      user.id,
    );

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${certificateId}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send PDF buffer
    res.end(pdfBuffer);
  }
}
