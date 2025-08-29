import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show error toast for 401 errors (handled by auth context)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    // If token is expired, clear it
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login will be handled by AuthContext
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
};

// Organization API calls
export const organizationAPI = {
  getAll: () => api.get('/organizations'),
  create: (data) => api.post('/organizations', data),
  getById: (id) => api.get(`/organizations/${id}`),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
  join: (data) => api.post('/organizations/join', data),
  getMembers: (id) => api.get(`/organizations/${id}/members`),
  inviteMember: (id, data) => api.post(`/organizations/${id}/members`, data),
  updateMemberRole: (orgId, memberId, data) => api.put(`/organizations/${orgId}/members/${memberId}`, data),
  removeMember: (orgId, memberId) => api.delete(`/organizations/${orgId}/members/${memberId}`),
};

// Service API calls
export const serviceAPI = {
  getByOrganization: (organizationId) => api.get(`/services/organization/${organizationId}`),
  create: (organizationId, data) => api.post(`/services/organization/${organizationId}`, data),
  getById: (id) => api.get(`/services/${id}`),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  updateStatus: (id, status) => api.patch(`/services/${id}/status`, { status }),
  updateUptime: (id, data) => api.patch(`/services/${id}/uptime`, data),
  reorder: (organizationId, serviceIds) => api.put(`/services/organization/${organizationId}/reorder`, { serviceIds }),
};

// Incident API calls
export const incidentAPI = {
  getByOrganization: (organizationId, params = {}) => api.get(`/incidents/organization/${organizationId}`, { params }),
  create: (organizationId, data) => api.post(`/incidents/organization/${organizationId}`, data),
  getById: (id) => api.get(`/incidents/${id}`),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  delete: (id) => api.delete(`/incidents/${id}`),
  createUpdate: (id, data) => api.post(`/incidents/${id}/updates`, data),
  getUpdates: (id) => api.get(`/incidents/${id}/updates`),
  getTimeline: (organizationId, params = {}) => api.get(`/incidents/organization/${organizationId}/timeline`, { params }),
};

// Public API calls (no auth required)
export const publicAPI = {
  getStatusPage: (slug) => api.get(`/public/status/${slug}`),
  getIncidents: (slug, params = {}) => api.get(`/public/status/${slug}/incidents`, { params }),
  getIncidentById: (slug, incidentId) => api.get(`/public/status/${slug}/incidents/${incidentId}`),
  getServiceUptime: (slug, serviceId, params = {}) => api.get(`/public/status/${slug}/services/${serviceId}/uptime`, { params }),
  getSummary: (slug) => api.get(`/public/status/${slug}/summary`),
};

// Helper functions
export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
  const errors = error.response?.data?.errors || [];
  
  return {
    message,
    errors,
    status: error.response?.status,
  };
};

export const isApiError = (error) => {
  return error.response && error.response.data;
};

export default api;
