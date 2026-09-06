import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization token if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fakeshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === Prediction ===
export const predictNews = async (text, model = 'auto') => {
  const { data } = await api.post('/predict', { text, model });
  return data;
};

// === Metrics ===
export const getMetrics = async () => {
  const { data } = await api.get('/metrics');
  return data;
};

// === SHAP Features ===
export const getShapFeatures = async () => {
  const { data } = await api.get('/shap-features');
  return data;
};

// === Outputs (images) ===
export const getOutputs = async () => {
  const { data } = await api.get('/outputs');
  return data;
};

export const getOutputUrl = (filename) => {
  return `${API_BASE}/api/outputs/${filename}`;
};

// === Health Check ===
export const getHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;
