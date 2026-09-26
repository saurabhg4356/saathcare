import { MockEmailProvider } from './mockEmailProvider.js';
import { SmtpEmailProvider } from './smtpEmailProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let providerInstance = null;

function getEmailProvider() {
  if (providerInstance) return providerInstance;

  if (env.EMAIL?.PROVIDER === 'smtp') {
    providerInstance = new SmtpEmailProvider();
  } else {
    providerInstance = new MockEmailProvider();
  }
  return providerInstance;
}

export class EmailService {
  /**
   * Primary entrypoint to dispatch emails
   */
  static async sendEmail({ to, subject, text, html, from }) {
    try {
      const provider = getEmailProvider();
      return await provider.send({ to, subject, text, html, from });
    } catch (error) {
      logger.error(`[EMAIL] Failed to dispatch email to ${to}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Templates
   */
  static getVerificationTemplate({ name, verificationUrl }) {
    return {
      subject: 'Verify your SaathCare account',
      text: `Hello ${name},\n\nPlease verify your email for SaathCare by clicking the link below:\n${verificationUrl}\n\nThis link is valid for 24 hours.\n\nWarm regards,\nThe SaathCare Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Welcome to SaathCare</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining SaathCare, the platform for collaborative family elder care. Please verify your email to activate full access to your care groups:</p>
          <p style="margin: 25px 0;">
            <a href="${verificationUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </p>
          <p style="color: #64748b; font-size: 13px;">This verification link will expire in 24 hours. If you did not register, please ignore this email.</p>
        </div>
      `
    };
  }

  static getPasswordResetTemplate({ name, resetUrl }) {
    return {
      subject: 'Reset your SaathCare password',
      text: `Hello ${name},\n\nWe received a request to reset your password. Click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this, please ignore this message.\n\nWarm regards,\nThe SaathCare Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset the password for your SaathCare account. Click the button below to choose a new password:</p>
          <p style="margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </p>
          <p style="color: #64748b; font-size: 13px;">This password reset link is valid for <strong>30 minutes</strong> and is single-use. If you did not request this, your password remains unchanged.</p>
        </div>
      `
    };
  }

  static getFamilyInviteTemplate({ inviterName, careRecipientName, inviteUrl }) {
    return {
      subject: `You're invited to join the care team for ${careRecipientName}`,
      text: `Hello,\n\n${inviterName} has invited you to join the SaathCare family care team for ${careRecipientName}.\n\nClick the link below to accept the invitation:\n${inviteUrl}\n\nThis link is valid for 7 days.\n\nWarm regards,\nThe SaathCare Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Family Care Team Invitation</h2>
          <p><strong>${inviterName}</strong> has invited you to coordinate elder care and shared expenses for <strong>${careRecipientName}</strong> on SaathCare.</p>
          <p style="margin: 25px 0;">
            <a href="${inviteUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </p>
          <p style="color: #64748b; font-size: 13px;">This invitation is valid for 7 days.</p>
        </div>
      `
    };
  }

  static getTaskAssignedTemplate({ taskTitle, dueAtFormatted, careRecipientName, groupName }) {
    return {
      subject: `New Care Duty Assigned: ${taskTitle}`,
      text: `A new care duty has been assigned to you for ${careRecipientName} in ${groupName}.\nTask: ${taskTitle}\nDue: ${dueAtFormatted}\n\nLog in to SaathCare to view details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #0d9488;">Care Duty Assigned</h3>
          <p>You have been assigned a new care task in <strong>${groupName}</strong> for <strong>${careRecipientName}</strong>:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0d9488; margin: 15px 0;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${taskTitle}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Due: ${dueAtFormatted}</p>
          </div>
        </div>
      `
    };
  }

  static getTaskMissedTemplate({ taskTitle, dueAtFormatted, assigneeName, careRecipientName, groupName }) {
    return {
      subject: `[ALERT] Overdue Care Duty: ${taskTitle}`,
      text: `Alert: The care duty "${taskTitle}" for ${careRecipientName} (assigned to ${assigneeName}) was missed (due at ${dueAtFormatted}).\n\nPlease check in with the care team.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
          <h3 style="color: #dc2626;">Overdue Care Duty Alert</h3>
          <p>A scheduled care duty in <strong>${groupName}</strong> for <strong>${careRecipientName}</strong> was not completed by its due time:</p>
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #991b1b;">${taskTitle}</p>
            <p style="margin: 0 0 4px 0; color: #7f1d1d; font-size: 14px;">Assigned to: ${assigneeName}</p>
            <p style="margin: 0; color: #7f1d1d; font-size: 14px;">Was due: ${dueAtFormatted}</p>
          </div>
        </div>
      `
    };
  }

  static getExpenseAddedTemplate({ payerName, amountFormatted, description, groupName }) {
    return {
      subject: `New Expense Logged in ${groupName}: ${amountFormatted}`,
      text: `${payerName} logged an expense of ${amountFormatted} for "${description}" in ${groupName}.\n\nLog in to SaathCare to view the ledger and current settlement breakdown.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #0d9488;">New Shared Expense</h3>
          <p><strong>${payerName}</strong> paid <strong>${amountFormatted}</strong> for <em>${description}</em> in <strong>${groupName}</strong>.</p>
          <p>The shared cost has been updated on the immutable family expense ledger.</p>
        </div>
      `
    };
  }
}
