import { EmailService } from './email/index.js';
import { env } from '../config/env.js';

export class LegacyEmailService {
  static async sendFamilyInvite({ toEmail, inviterName, careRecipientName, inviteToken }) {
    const inviteUrl = `${env.CLIENT_URL}/accept-invite/${inviteToken}`;
    const template = EmailService.getFamilyInviteTemplate({
      inviterName,
      careRecipientName,
      inviteUrl
    });

    await EmailService.sendEmail({
      to: toEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    return {
      success: true,
      inviteUrl,
      recipient: toEmail
    };
  }
}

export { EmailService, LegacyEmailService as EmailServiceWrapper };
export default EmailService;
