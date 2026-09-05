import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealthStatus = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'offline' };
  }
};

export const getCustomers = async () => {
  const response = await api.get('/api/customers');
  return response.data;
};

export const getProducts = async () => {
  const response = await api.get('/api/products');
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/api/orders');
  return response.data;
};

export const getReturns = async (params = {}) => {
  const response = await api.get('/api/returns', { params });
  return response.data;
};

export const getReturnById = async (caseId) => {
  const response = await api.get(`/api/returns/${caseId}`);
  return response.data;
};

export const createReturn = async (returnPayload) => {
  const response = await api.post('/api/returns', returnPayload);
  return response.data;
};

export const uploadEvidence = async (caseId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/api/returns/${caseId}/evidence`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateReturn = async (caseId, updatePayload) => {
  const response = await api.patch(`/api/returns/${caseId}`, updatePayload);
  return response.data;
};

export default api;
