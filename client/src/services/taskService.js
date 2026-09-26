import api from './api.js';

export const taskService = {
  async getTasks(familyGroupId, params = {}) {
    const res = await api.get(`/tasks/${familyGroupId}`, { params });
    return res;
  },

  async createTask(familyGroupId, taskData, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post(`/tasks/${familyGroupId}`, taskData, { headers });
    return res.data;
  },

  async completeTask(familyGroupId, taskId, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.patch(`/tasks/${familyGroupId}/${taskId}/complete`, {}, { headers });
    return res.data;
  }
};
