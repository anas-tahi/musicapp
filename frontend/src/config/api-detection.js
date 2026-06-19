import { Platform } from 'react-native';

// Auto-detect local IP for development
export const getLocalIp = () => {
  // For development, you can manually set this or implement auto-detection
  // For now, return a common development IP - user should update if different
  return 'http://172.17.75.98:5000';
};

// Fallback to production URL if needed
export const PRODUCTION_URL = 'https://your-api-domain.com';

export const getApiBaseUrl = () => {
  // In development, use local IP
  if (__DEV__) {
    return getLocalIp();
  }
  // In production, use your deployed API URL
  return PRODUCTION_URL;
};

// Export the base URL
export const BASE_URL = getApiBaseUrl();
