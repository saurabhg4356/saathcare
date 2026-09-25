import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class EmailService {
  /**
   * Dispatches family invitation email
   * In development, logs the secure onboarding URL to console
   */
  static async sendFamilyInvite({ toEmail, inviterName, careRecipientName, inviteToken }) {
    const inviteUrl = `${env.CLIENT_URL}/accept-invite/${inviteToken}`;

    logger.info('------------------------------------------------------------');
    logger.info(`[EMAIL SERVICE] INVITATION DISPATCHED`);
    logger.info(`To: ${toEmail}`);
    logger.info(`Subject: You have been invited to join the care team for ${careRecipientName}`);
    logger.info(`Invited By: ${inviterName}`);
    logger.info(`Accept URL: ${inviteUrl}`);
    logger.info(`Valid for: 7 Days`);
    logger.info('------------------------------------------------------------');

    return {
      success: true,
      inviteUrl,
      recipient: toEmail
    };
  }
}
