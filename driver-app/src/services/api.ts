import axios from 'axios';
import { store } from '../store/auth';

const API_BASE = 'http://103.108.220.134:3000/api/v1';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = store.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  me: () => api.get('/auth/me'),
};

export const attendanceApi = {
  mark: (data: any) => api.post('/attendance/mark', data),
  scanVehicle: (vehicleId: string) => api.get(`/attendance/scan/${vehicleId}`),
  getDriverHistory: (driverId: string) => api.get(`/attendance/driver/${driverId}`),
  getToday: () => api.get('/attendance/today'),
};

export const gpsApi = {
  sendLocation: (data: any) => api.post('/gps/events', data),
};

export default api;
