import nodemailer from 'nodemailer';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

export class SmtpEmailProvider {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (!env.EMAIL.SMTP_HOST) {
      logger.warn('[EMAIL] SMTP_HOST not configured. SMTP provider initialized in standby mode.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.EMAIL.SMTP_HOST,
      port: env.EMAIL.SMTP_PORT || 587,
      secure: env.EMAIL.SMTP_SECURE || false,
      auth: {
        user: env.EMAIL.SMTP_USER,
        pass: env.EMAIL.SMTP_PASS
      }
    });
  }

  async send({ to, subject, text, html, from }) {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment.');
    }

    const mailOptions = {
      from: from || env.EMAIL.EMAIL_FROM || 'SaathCare <noreply@saathcare.org>',
      to,
      subject,
      text,
      html
    };

    const info = await this.transporter.sendMail(mailOptions);
    logger.info(`[EMAIL] SMTP email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      recipient: to
    };
  }
}
