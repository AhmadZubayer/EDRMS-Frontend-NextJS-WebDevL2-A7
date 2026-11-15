import axios from 'axios';
import { normalizeApiRecord } from './api-records';

const apiConfig = {
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const publicApi = axios.create(apiConfig);
export const axiosSecure = axios.create(apiConfig);

// Use the same bearer token for retained dashboards and the admin panel.
for (const client of [publicApi, axiosSecure]) {
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  client.interceptors.response.use((response) => {
    const url = response.config.url || '';
    if (/^\/(?:missing-persons|rescue-requests|disasters|donations|community-posts|trash|admin|volunteers)(?:[/?]|$)/.test(url)
      && !url.startsWith('/admin/tables') && response.data?.data) {
      response.data.data = normalizeApiRecord(response.data.data);
    }
    return response;
  });
}
