import { ContactMessage } from '../models/ContactMessage.js';
import { EmailService } from './email/index.js';
import { logger } from '../config/logger.js';

export class ContactService {
  /**
   * Submit a new contact inquiry
   * Persists message to MongoDB first, then attempts notification
   */
  static async submitMessage({ name, email, subject, message }) {
    // 1. Save message to MongoDB before attempting email dispatch
    const contactRecord = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      emailSent: false
    });

    logger.info(`[CONTACT] Inbound contact message saved with ID: ${contactRecord._id} from ${email}`);

    // 2. Attempt email notification/acknowledgement (non-blocking failure)
    try {
      await EmailService.sendEmail({
        to: email,
        subject: `We received your inquiry: ${subject}`,
        text: `Hello ${name},\n\nThank you for reaching out to SaathCare. We have received your message:\n\n"${message}"\n\nOur team will review your inquiry and get back to you shortly.\n\nWarm regards,\nThe SaathCare Support Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0d9488;">Thank you for contacting SaathCare</h2>
            <p>Hello ${name},</p>
            <p>We received your message regarding <strong>${subject}</strong>:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0d9488; margin: 15px 0;">
              <p style="margin: 0; color: #334155; font-style: italic;">"${message}"</p>
            </div>
            <p>Our elder-care support team will review your message and reply promptly.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 13px;">SaathCare — Coordinated Elder Care & Transparent Cost Ledger</p>
          </div>
        `
      });

      contactRecord.emailSent = true;
      await contactRecord.save();
      logger.info(`[CONTACT] Acknowledgment email sent successfully to ${email}`);
    } catch (err) {
      logger.warn(`[CONTACT] Acknowledgment email dispatch failed for ${email}: ${err.message}. Message remains safely saved in DB.`);
    }

    return contactRecord;
  }
}
