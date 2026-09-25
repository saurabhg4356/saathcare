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
  }
};
