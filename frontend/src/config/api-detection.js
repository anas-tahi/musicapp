import { Platform } from 'react-native';

export const getLocalIp = () => {
  return 'https://musicapp-r2hb.onrender.com';
};

export const PRODUCTION_URL = 'https://musicapp-r2hb.onrender.com';

export const getApiBaseUrl = () => {
  // In development, use local IP
  if (__DEV__) {
    return getLocalIp();
  }
  return PRODUCTION_URL;
};

export const BASE_URL = getApiBaseUrl();