// Centralized API configuration with automatic production fallback
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  
  // Production fallback for live custom domain
  if (typeof window !== 'undefined' && (window.location.hostname.includes('midouphone.tech') || window.location.hostname.includes('vercel.app'))) {
    return 'https://midou-phone-backend.onrender.com';
  }
  
  return 'http://localhost:4000';
};

export const API_BASE_URL = getApiUrl();
