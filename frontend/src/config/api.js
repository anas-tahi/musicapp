import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getLocalIp } from './api-detection';

// Dynamic IP detection - update getLocalIp() in api-detection.js if needed
export const BASE_URL = getLocalIp();

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
