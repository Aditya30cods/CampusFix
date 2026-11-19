import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(config => { const token = localStorage.getItem('campusfix-token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(r => r, error => { if (error.response?.status === 401) { localStorage.removeItem('campusfix-token'); localStorage.removeItem('campusfix-user'); if (!location.pathname.startsWith('/login')) location.assign('/login'); } return Promise.reject(error); });
export const messageOf = error => error.response?.data?.message || 'Could not reach CampusFix. Check the API and try again.';
export default api;
