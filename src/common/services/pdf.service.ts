import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';

export interface CertificateData {
  studentName: string;
  courseName: string;
  completedAt: Date;
  certificateId: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private templatePath: string;

  constructor() {
    this.templatePath = join(
      process.cwd(),
      'src/common/templates/certificates/certificate.hbs',
    );
  }

  /**
   * Generate a certificate PDF as a buffer
   */
  async generateCertificate(data: CertificateData): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.log(
        `Generating certificate for ${data.studentName} - ${data.certificateId}`,
      );

      // Read the Handlebars template
      const templateSource = readFileSync(this.templatePath, 'utf-8');

      // Compile the template
      const template = hbs.compile(templateSource);

      // Format the completion date
      const completedDate = new Date(data.completedAt).toLocaleDateString(
        'id-ID',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      // Prepare template data
      const templateData = {
        studentName: data.studentName,
        courseName: data.courseName,
        completedDate: completedDate,
        certificateId: data.certificateId,
      };

      // Generate HTML from template
      const html = template(templateData);
      this.logger.debug('HTML template compiled successfully');

      // Launch Puppeteer browser
      this.logger.log('Launching Puppeteer browser...');
      const launchOptions = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      };

      browser = await puppeteer.launch(launchOptions);

      // Create new page
      const page = await browser.newPage();

      // Set content and wait for it to load
      this.logger.log('Setting page content...');
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      this.logger.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'a4',
        landscape: true,
        printBackground: true,
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });

      this.logger.log(
        `PDF generated successfully. Size: ${pdfBuffer.length} bytes`,
      );

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate certificate PDF: ${error.message}`);
    } finally {
      // Always close the browser to prevent resource leaks
      if (browser) {
        this.logger.debug('Closing browser...');
        await browser.close();
      }
    }
  }
}
