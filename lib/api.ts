import axios from 'axios';

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

// The retained report views use snake_case fields. Keep the API's camelCase
// response available while supplying the fields those views and edit forms use.
const normalizeMissingPerson = (person: Record<string, unknown>) => ({
  ...person,
  reporter_id: person.reporterId ?? person.reporter_id,
  full_name: person.fullName ?? person.full_name,
  last_seen_location: person.lastSeenLocation ?? person.last_seen_location,
  last_seen_date: person.lastSeenDate ?? person.last_seen_date,
  contact_phone: person.contactPhone ?? person.contact_phone,
  photo_url: person.photoUrl ?? person.photo_url,
  created_at: person.createdAt ?? person.created_at,
  updated_at: person.updatedAt ?? person.updated_at,
});

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
    if (/^\/missing-persons(?:[/?]|$)/.test(response.config.url || '') && response.data?.data) {
      const data = response.data.data;
      response.data.data = Array.isArray(data)
        ? data.map(normalizeMissingPerson)
        : normalizeMissingPerson(data);
    }
    return response;
  });
}
