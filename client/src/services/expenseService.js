import api from './api.js';

export const expenseService = {
  async getLedger(familyGroupId, params = {}) {
    const res = await api.get(`/expenses/${familyGroupId}`, { params });
    return res;
  },

  async recordExpense(familyGroupId, expenseData) {
    const res = await api.post(`/expenses/${familyGroupId}`, expenseData);
    return res.data;
  },

  async reverseExpense(familyGroupId, expenseId, reason) {
    const res = await api.post(`/expenses/${familyGroupId}/${expenseId}/reverse`, { reason });
    return res.data;
  },

  async getSettlements(familyGroupId) {
    const res = await api.get(`/expenses/${familyGroupId}/settlements`);
    return res.data;
  }
};
