import api from './api.js';

export const contactService = {
  /**
   * Submit an inquiry to the backend
   */
  async submitContact({ name, email, subject, message, website_url = '' }) {
    const response = await api.post('/contact', {
      name,
      email,
      subject,
      message,
      website_url
    });
    return response;
  }
};
