import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
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
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createGoogleTransporter();
  }

  async sendTestEmail(): Promise<boolean> {
    return this.sendEmail({
      to: 'azwarans23@gmail.com',
      subject: 'Google OAuth2 Test',
      html: '<h1>Google OAuth2 Works!</h1>',
    });
  }

  private async createGoogleTransporter() {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );
      const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
      const refreshToken = this.configService.get<string>(
        'GOOGLE_REFRESH_TOKEN',
      );
      const emailSender = this.configService.get<string>('EMAIL_SENDER');

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const accessToken = await oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: emailSender,
          clientId,
          clientSecret,
          refreshToken,
          accessToken: accessToken.token || undefined,
        },
      });

      await this.transporter.verify();
      this.logger.log('Gmail OAuth2 transporter is ready.');
    } catch (error) {
      this.logger.error('Failed to create Gmail transporter:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Transporter not initialized.');
      return false;
    }

    try {
      const from =
        options.from ||
        this.configService.get<string>('EMAIL_SENDER') ||
        'no-reply@example.com';

      const info = await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
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
        'src/common/templates/email',
        `${template}.hbs`,
      );

      const source = fs.readFileSync(templatePath, 'utf8');
      const compiled = hbs.compile(source);
      return compiled(data);
    } catch (error) {
      this.logger.error('Failed to compile template:', error);
      return '<h1>Template Error</h1>';
    }
  }
}
