import api, { setStoredAccessToken } from './api.js';

export const authService = {
  async register({ name, email, password }) {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setStoredAccessToken(null);
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async verifyEmail(token) {
    const res = await api.get(`/auth/verify-email/${token}`);
    return res.data;
  },

  async resendVerification(email) {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, password) {
    const res = await api.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  },

  async requestDeletion() {
    const res = await api.post('/auth/request-deletion');
    return res.data;
  },

  async cancelDeletion() {
    const res = await api.post('/auth/cancel-deletion');
    return res.data;
  },

  async completeOnboarding() {
    const res = await api.patch('/auth/onboarding', { hasSeenOnboarding: true });
    return res.data;
  }
};
