import api from './api.js';

export const expenseService = {
  async getLedger(familyGroupId, params = {}) {
    const res = await api.get(`/expenses/${familyGroupId}`, { params });
    return res;
  },

  async recordExpense(familyGroupId, expenseData, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post(`/expenses/${familyGroupId}`, expenseData, { headers });
    return res.data;
  },

  async uploadReceipt(familyGroupId, file) {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.post(`/expenses/${familyGroupId}/upload-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  async getReceiptUrl(familyGroupId, expenseId) {
    const res = await api.get(`/expenses/${familyGroupId}/${expenseId}/receipt-url`);
    return res.data;
  },

  async reverseExpense(familyGroupId, expenseId, reason, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post(`/expenses/${familyGroupId}/${expenseId}/reverse`, { reason }, { headers });
    return res.data;
  },

  async getSettlements(familyGroupId) {
    const res = await api.get(`/expenses/${familyGroupId}/settlements`);
    return res.data;
  }
};
