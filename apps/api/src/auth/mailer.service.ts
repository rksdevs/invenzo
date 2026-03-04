import { Injectable, Logger } from '@nestjs/common';

interface VerificationMailInput {
  to: string;
  ownerName: string;
  businessName: string;
  verificationLink: string;
}

interface MailSendResult {
  sent: boolean;
  reason?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: any | null;
  private readonly fromName: string;
  private readonly fromAddress: string;

  constructor() {
    this.fromName = process.env.SMTP_FROM_NAME ?? 'Invenzo';
    this.fromAddress = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? 'no-reply@localhost';

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP is not fully configured. Verification emails are disabled.');
      this.transporter = null;
      return;
    }

    try {
      // Keep runtime dependency optional in constrained environments.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } catch (error) {
      this.logger.error('Nodemailer is not installed. Run: npm install -w @invenzo/api nodemailer @types/nodemailer');
      this.transporter = null;
    }
  }

  async sendVerificationEmail(input: VerificationMailInput): Promise<MailSendResult> {
    if (!this.transporter) {
      return { sent: false, reason: 'SMTP_DISABLED' };
    }

    const subject = `Verify your ${input.businessName} account`;
    const text = [
      `Hi ${input.ownerName},`,
      '',
      'Thanks for signing up with Invenzo.',
      'Please verify your email using the link below:',
      input.verificationLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#003032">
        <h2 style="margin:0 0 8px">Welcome to Invenzo</h2>
        <p>Hi ${input.ownerName},</p>
        <p>Thanks for signing up for <strong>${input.businessName}</strong>.</p>
        <p>
          Please verify your email to activate login:
          <a href="${input.verificationLink}" target="_blank" rel="noreferrer">Verify email</a>
        </p>
        <p style="font-size:12px;color:#4a6665">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: input.to,
        subject,
        text,
        html,
      });
      return { sent: true };
    } catch (error) {
      this.logger.error('Failed to send verification email', error as Error);
      return { sent: false, reason: 'SMTP_SEND_FAILED' };
    }
  }
}
