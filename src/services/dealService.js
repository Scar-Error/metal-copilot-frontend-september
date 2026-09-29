import { getToken } from './authService';
import createApiClient from './httpClient';
import { API_ORIGIN } from '../config/api';

// These five were hardcoded to the production domain, so every deal/thread call bypassed
// the local backend in development. Now they resolve through the Vite proxy in dev and
// through the production origin in a `npm run build` bundle.
const API_BASE = `${API_ORIGIN}/api/rfq/deals`;
const API_THREADS = `${API_ORIGIN}/api/rfq/email-threads`;
const API_PULL = `${API_ORIGIN}/api/rfq/monitor/emails/pull/`;
const API_TASK = `${API_ORIGIN}/api/rfq/monitor/task`;
const API_ATTACHMENTS = `${API_ORIGIN}/api/rfq/deals`;

const api = createApiClient();

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

const dealService = {
  getDeals: async (params = {}) => {
    const res = await api.get(API_BASE, { ...getHeaders(), params });
    return res.data;
  },

  getDeal: async (id) => {
    const res = await api.get(`${API_BASE}/${id}/`, getHeaders());
    return res.data;
  },

  createDeal: async (data) => {
    const files = data.attachments || [];
    const dealData = { ...data };
    delete dealData.attachments;

    const res = await api.post(API_BASE, dealData, getHeaders());
    const deal = res.data;

    if (files.length > 0) {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      await api.post(`${API_ATTACHMENTS}/${deal.id}/attachments/`, formData, {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    return deal;
  },

  updateDeal: async (id, data) => {
    const res = await api.put(`${API_BASE}/${id}/`, data, getHeaders());
    return res.data;
  },

  deleteDeal: async (id) => {
    const res = await api.delete(`${API_BASE}/${id}/`, getHeaders());
    return res.data;
  },

  pullEmails: async (start_time, end_time) => {
    const res = await api.post(API_PULL, { start_time, end_time }, getHeaders());
    return res.data;
  },

  getTaskStatus: async (taskId) => {
    const res = await api.get(`${API_TASK}/${taskId}/`, getHeaders());
    return res.data;
  },

  // Kanban board load: returns threads WITHOUT message bodies (light payload).
  getEmailThreads: async (params = {}) => {
    const res = await api.get(API_THREADS, { ...getHeaders(), params });
    return res.data;
  },

  // Fired when the user clicks "View Deal". This is the only request that pulls the
  // thread's message data, so the heavy email bodies are not sent on page load.
  getEmailThread: async (threadId) => {
    const res = await api.get(`${API_THREADS}/${threadId}/`, getHeaders());
    return res.data;
  },

  // Single-thread delete. Note: this also deletes the thread's messages on the
  // server (CASCADE), so it cannot be undone.
  deleteEmailThread: async (threadId) => {
    const res = await api.delete(`${API_THREADS}/${threadId}/`, getHeaders());
    return res.data;
  },

  // Bulk delete for the pipeline's multi-select mode. The route uses an underscore
  // because DRF derives the url_path from the viewset method name.
  bulkDeleteEmailThreads: async (ids) => {
    const res = await api.post(`${API_THREADS}/bulk_delete/`, { ids }, getHeaders());
    return res.data;
  },

  categorizeThread: async (threadId) => {
    const res = await api.post(`${API_THREADS}/${threadId}/categorize/`, {}, getHeaders());
    return res.data;
  },

  updateThread: async (threadId, data) => {
    const res = await api.patch(`${API_THREADS}/${threadId}/`, data, getHeaders());
    return res.data;
  },
};

export default dealService;
