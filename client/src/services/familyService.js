import api from './api.js';

export const familyService = {
  async getMyGroups() {
    const res = await api.get('/family-groups');
    return res.data;
  },

  async createGroup({ careRecipientName, groupName }) {
    const res = await api.post('/family-groups', { careRecipientName, groupName });
    return res.data;
  },

  async getGroupDetails(familyGroupId) {
    const res = await api.get(`/family-groups/${familyGroupId}`);
    return res.data;
  },

  async createInvite(familyGroupId, email) {
    const res = await api.post(`/family-groups/${familyGroupId}/invites`, { email });
    return res.data;
  },

  async getPendingInvites(familyGroupId) {
    const res = await api.get(`/family-groups/${familyGroupId}/invites`);
    return res.data;
  },

  async getInvitePreview(token) {
    const res = await api.get(`/family-groups/invites/${token}`);
    return res.data;
  },

  async acceptInvite(token) {
    const res = await api.post(`/family-groups/invites/${token}/accept`);
    return res.data;
  }
};
