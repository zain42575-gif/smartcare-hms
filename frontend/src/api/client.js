import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true 
});

api.interceptors.response.use((r) => r, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
    originalRequest._retry = true;
    try {
      await api.post('/auth/refresh');
      return api(originalRequest);
    } catch (refreshError) {
      window.dispatchEvent(new Event('auth-expired'));
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error);
});

export default api;
