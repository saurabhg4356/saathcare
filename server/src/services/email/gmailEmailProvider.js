import nodemailer from 'nodemailer';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

export class GmailEmailProvider {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = env.EMAIL.GMAIL_USER;
    const clientId = env.EMAIL.GMAIL_CLIENT_ID;
    const clientSecret = env.EMAIL.GMAIL_CLIENT_SECRET;
    const rawRefreshToken = env.EMAIL.GMAIL_REFRESH_TOKEN || '';
    const refreshToken = rawRefreshToken.replace(/^token:\s*/i, '').trim();

    if (!user || !clientId || !clientSecret || !refreshToken) {
      logger.warn('[EMAIL] Gmail OAuth2 credentials incomplete. Gmail provider initialized in standby mode.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user,
          clientId,
          clientSecret,
          refreshToken
        }
      });

      // Asynchronously verify transporter readiness
      this.transporter.verify((error) => {
        if (error) {
          logger.warn(`[EMAIL] Gmail OAuth2 transporter verification warning: ${error.message}`);
        } else {
          logger.info(`[EMAIL] Gmail OAuth2 transporter verified and ready for ${user}`);
        }
      });
    } catch (err) {
      logger.error(`[EMAIL] Failed to initialize Gmail OAuth2 transporter: ${err.message}`, err);
    }
  }

  async send({ to, subject, text, html, from }) {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      throw new Error(
        'Gmail OAuth2 transporter is not configured. Set GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.'
      );
    }

    const defaultFrom = env.EMAIL.GMAIL_USER
      ? `"SaathCare" <${env.EMAIL.GMAIL_USER}>`
      : env.EMAIL.EMAIL_FROM || 'SaathCare <noreply@saathcare.org>';

    const mailOptions = {
      from: from || defaultFrom,
      to,
      subject,
      text,
      html
    };

    const info = await this.transporter.sendMail(mailOptions);
    logger.info(`[EMAIL] Gmail email dispatched successfully to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
      recipient: to
    };
  }
}
