import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as hbs from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter(): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      this.logger.warn(
        'SMTP configuration is incomplete. Email service will not be available.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection established successfully.');
    } catch (error) {
      this.logger.error('Failed to establish SMTP connection:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error(
        'Email transporter is not configured. Attempting to create transporter.',
      );
      return false;
    }

    try {
      const defaultFrom =
        this.configService.get<string>('SMTP_EMAIL_SENDER') ||
        '<default_sender@example.com>';

      const mailOptions = {
        from: options.from || defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${mailOptions.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  public compileTemplate(template: string, data: any): string {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'common',
        'templates',
        'email',
        `${template}.hbs`,
      );

      const templateSources = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = hbs.compile(templateSources);
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error('Error compiling email template:', error);
      return '<h1>Template Error</h1><p>Unable to load email content.</p>';
    }
  }

  async sendTestEmail(): Promise<boolean> {
    const html = this.compileTemplate('test', {
      name: 'Test User',
      timestamp: new Date().toISOString(),
    });
    return this.sendEmail({
      to: '<recipient@example.com>',
      subject: 'Test Email',
      html,
    });
  }
}
