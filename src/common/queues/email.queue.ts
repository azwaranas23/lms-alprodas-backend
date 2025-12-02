import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { Job } from 'bull';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: any;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);

    try {
      const { to, subject, text, html, template, templateData } = job.data;

      let emailHtml = html;
      if (template && templateData) {
        emailHtml = this.emailService.compileTemplate(template, templateData);
      }

      const email = await this.emailService.sendEmail({
        to,
        subject,
        text,
        html: emailHtml,
      });

      if (email) {
        this.logger.log(`Email job ${job.id} sent successfully to ${to}`);
      } else {
        this.logger.warn(`Email job ${job.id} failed to send to ${to}`);
        throw new Error('Email sending failed');
      }
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}:`, error);
      throw error;
    }
  }
}
