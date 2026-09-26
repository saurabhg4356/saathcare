import axios from 'axios';

export const statsService = {
  /**
   * Fetch public system statistics
   */
  async getPublicStats() {
    const response = await axios.get('/api/stats');
    return response.data?.data || null;
  }
};
