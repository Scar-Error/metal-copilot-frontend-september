import { getToken } from './authService';
import createApiClient from './httpClient';
import { API_ORIGIN } from '../config/api';

// Was hardcoded to the production domain; now dev uses the Vite proxy to the local backend.
const API_BASE = `${API_ORIGIN}/api/tasks/`;

const api = createApiClient();

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

const taskService = {
  getTasks: async (params = {}) => {
    const res = await api.get(API_BASE, { ...getHeaders(), params });
    return res.data;
  },

  getTask: async (id) => {
    const res = await api.get(`${API_BASE}/${id}/`, getHeaders());
    return res.data;
  },

  createTask: async (data) => {
    const res = await api.post(API_BASE, data, getHeaders());
    return res.data;
  },

  updateTask: async (id, data) => {
    const res = await api.put(`${API_BASE}/${id}/`, data, getHeaders());
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await api.delete(`${API_BASE}/${id}/`, getHeaders());
    return res.data;
  },

  completeTask: async (id) => {
    const res = await api.post(`${API_BASE}/${id}/complete/`, {}, getHeaders());
    return res.data;
  },
};

export default taskService;
