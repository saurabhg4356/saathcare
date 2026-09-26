import axios from 'axios';

export const contactService = {
  /**
   * Submit an inquiry to the backend
   */
  async submitContact({ name, email, subject, message, website_url = '' }) {
    const response = await axios.post('/api/contact', {
      name,
      email,
      subject,
      message,
      website_url
    });
    return response.data;
  }
};
