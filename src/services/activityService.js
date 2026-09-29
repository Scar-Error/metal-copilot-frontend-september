import { getToken } from './authService';
import createApiClient from './httpClient';
import { API_ORIGIN } from '../config/api';

// Was hardcoded to the production domain; now dev uses the Vite proxy to the local backend.
const API_BASE = `${API_ORIGIN}/api/activity`;

const api = createApiClient();

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

const activityService = {
  getActivity: async (entityType, entityId) => {
    const res = await api.get(`${API_BASE}/`, {
      ...getHeaders(),
      params: { entity_type: entityType, entity_id: entityId },
    });
    return res.data;
  },

  addNote: async (entityType, entityId, text) => {
    const res = await api.post(
      `${API_BASE}/notes/`,
      { entity_type: entityType, entity_id: entityId, text },
      getHeaders()
    );
    return res.data;
  },
};

export default activityService;
