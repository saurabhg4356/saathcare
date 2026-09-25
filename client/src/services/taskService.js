import api from './api.js';

export const taskService = {
  async getTasks(familyGroupId, params = {}) {
    const res = await api.get(`/tasks/${familyGroupId}`, { params });
    return res;
  },

  async createTask(familyGroupId, taskData) {
    const res = await api.post(`/tasks/${familyGroupId}`, taskData);
    return res.data;
  },

  async completeTask(familyGroupId, taskId) {
    const res = await api.patch(`/tasks/${familyGroupId}/${taskId}/complete`);
    return res.data;
  }
};
