import { ContactService } from '../services/contact.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export async function handleContactSubmission(req, res, next) {
  try {
    const { name, email, subject, message, website_url } = req.body;

    // Honeypot spam defense: if hidden field is filled, silently return success
    if (website_url && website_url.trim().length > 0) {
      logger.warn(`[CONTACT] Bot submission trapped via honeypot field from IP: ${req.ip}`);
      return res.status(200).json(
        new ApiResponse(200, null, 'Your message has been received successfully.')
      );
    }

    const savedMessage = await ContactService.submitMessage({ name, email, subject, message });

    return res.status(201).json(
      new ApiResponse(201, { id: savedMessage._id }, 'Your message has been received. Our team will get back to you shortly.')
    );
  } catch (error) {
    next(error);
  }
}
