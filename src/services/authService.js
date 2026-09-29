/**
 * Authentication Service
 * Handles all API calls related to authentication
 */
import createApiClient from './httpClient';
import { API_ORIGIN } from '../config/api';

// Was hardcoded to the production domain, so login always hit the remote server.
// Now relative in dev (routed to local Django via the Vite proxy) and absolute in prod builds.
const API_BASE_URL = `${API_ORIGIN}/api/auth`;

const api = createApiClient(API_BASE_URL);

/**
 * Login function
 * @param {string} username - Email or username
 * @param {string} password - User password
 * @returns {Promise} - Response with access and refresh tokens
 */
export const login = async (username, password) => {
  try {
    const response = await api.post('/login/', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

/**
 * Get protected data
 * @param {string} token - JWT access token
 * @returns {Promise} - Response with protected data
 */
export const getProtectedData = async (token) => {
  try {
    const response = await api.get('/protected/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch protected data' };
  }
};

export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if a valid, non-expired token exists in localStorage
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  if (isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
};

/**
 * Get the access token from localStorage
 * @returns {string|null} - Access token or null
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Logout function
 * Removes tokens from localStorage
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Microsoft OAuth2 Login
 * Initiates Microsoft login flow
 * @returns {Promise} - Response with authorization URL
 */
export const microsoftLogin = async () => {
  try {
    const response = await api.get('/microsoft/login/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Microsoft login failed' };
  }
};

/**
 * Refresh Microsoft token
 * @returns {Promise} - Response with new access token
 */
export const refreshMicrosoftToken = async () => {
  try {
    const token = getToken();
    const response = await api.post('/microsoft/refresh/', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Token refresh failed' };
  }
};

/**
 * Get Microsoft account connection status
 * @returns {Promise} - Response with connection status
 */
export const getMicrosoftStatus = async () => {
  try {
    const token = getToken();
    const response = await api.get('/microsoft/status/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get status' };
  }
};

/**
 * Disconnect Microsoft account
 * @returns {Promise} - Response confirming disconnection
 */
export const disconnectMicrosoft = async () => {
  try {
    const token = getToken();
    const response = await api.post('/microsoft/disconnect/', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Disconnect failed' };
  }
};