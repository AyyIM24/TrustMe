import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fakeshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fakeshield_token');
      localStorage.removeItem('fakeshield_refresh_token');
      localStorage.removeItem('fakeshield_user');
      // Only redirect on protected pages
      const publicPaths = ['/', '/login', '/register', '/trending', '/news'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API Functions ────────────────────────────────────

// Auth
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refresh_token: refreshToken }),
  getProfile: () => client.get('/auth/profile'),
  updateFace: (faceData) => client.put('/auth/profile/face', { face_data: faceData }),
  changePassword: (data) => client.put('/auth/profile/password', data),
  checkFace: (username) => client.get('/auth/check-face', { params: { username } }),
  loginFace: (data) => client.post('/auth/login-face', data),
  loginGoogle: (token) => client.post('/auth/google', { token }),
};

// Analysis
export const analyzeAPI = {
  analyzeText: (data) => client.post('/analyze', data),
  analyzeUrl: (data) => client.post('/analyze/url', data),
  getAnalysis: (id) => client.get(`/analyze/${id}`),
};

// History
export const historyAPI = {
  getHistory: (params) => client.get('/history', { params }),
};

// Feedback
export const feedbackAPI = {
  submit: (analysisId, data) => client.post(`/feedback/${analysisId}`, data),
};

// Stats
export const statsAPI = {
  getDashboard: () => client.get('/stats/dashboard'),
  getTrending: () => client.get('/stats/trending'),
  getGlobal: () => client.get('/stats/global'),
  getCategories: () => client.get('/stats/categories'),
};

// News
export const newsAPI = {
  getFeed: (category = 'general', limit = 20) =>
    client.get('/news/feed', { params: { category, limit } }),
  getCategories: () => client.get('/news/categories'),
};

// Fact Check
export const factCheckAPI = {
  check: (claim) => client.post('/factcheck/check', { claim }),
  checkClaim: (claim) => client.post('/factcheck/check', { claim }),
  getExamples: () => client.get('/factcheck/examples'),
};

export default client;
