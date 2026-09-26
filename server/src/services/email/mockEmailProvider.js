import { logger } from '../../config/logger.js';

export class MockEmailProvider {
  constructor() {
    this.sentEmails = [];
  }

  async send({ to, subject, text, html, from }) {
    const emailRecord = {
      to,
      subject,
      text,
      html,
      from: from || 'SaathCare <noreply@saathcare.org>',
      timestamp: new Date().toISOString()
    };

    this.sentEmails.push(emailRecord);

    logger.info('------------------------------------------------------------');
    logger.info(`[MOCK EMAIL DISPATCHED]`);
    logger.info(`To: ${to}`);
    logger.info(`Subject: ${subject}`);
    if (text) logger.info(`Content: ${text.substring(0, 120)}...`);
    logger.info('------------------------------------------------------------');

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      recipient: to
    };
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
  }
}
