// Centralized API configuration with automatic production and mobile network fallback
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production domain & Vercel
    if (hostname.includes('midouphone.tech') || hostname.includes('vercel.app')) {
      return 'https://midou-phone-api-hefrdbfmcahefhtz.spaincentral-01.azurewebsites.net';
    }
    // Local development from mobile on same Wi-Fi network (e.g. 192.168.1.X)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:4000`;
    }
  }
  
  return 'http://localhost:4000';
};

export const API_BASE_URL = getApiUrl();
