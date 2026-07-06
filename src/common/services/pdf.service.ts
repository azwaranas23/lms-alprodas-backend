import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  private readonly templatePath: string;

  constructor() {
    this.templatePath = join(
      process.cwd(),
      'src/common/templates/certificates/certificate.hbs',
    );
  }

  private getBrowserExecutablePath(): string | undefined {
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (envPath && existsSync(envPath)) {
      return envPath;
    }

    const possiblePaths =
      process.platform === 'win32'
        ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
        : [
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
        ];

    return possiblePaths.find((browserPath) => existsSync(browserPath));
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

      const templateSource = readFileSync(this.templatePath, 'utf-8');
      const template = hbs.compile(templateSource);

      const completedDate = new Date(data.completedAt).toLocaleDateString(
        'id-ID',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      const templateData = {
        studentName: data.studentName,
        courseName: data.courseName,
        completedDate,
        certificateId: data.certificateId,
      };

      const html = template(templateData);
      this.logger.debug('HTML template compiled successfully');

      const executablePath = this.getBrowserExecutablePath();

      this.logger.log(
        executablePath
          ? `Launching Puppeteer browser: ${executablePath}`
          : 'Launching Puppeteer browser using default bundled browser',
      );

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
        ...(executablePath ? { executablePath } : {}),
      };

      browser = await puppeteer.launch(launchOptions);

      if (executablePath) {
        launchOptions.executablePath = executablePath;
      }

      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();

      this.logger.log('Setting page content...');
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

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
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate certificate PDF: ${message}`);
    } finally {
      if (browser) {
        this.logger.debug('Closing browser...');
        await browser.close();
      }
    }
  }
}