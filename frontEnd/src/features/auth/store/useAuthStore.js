import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  adminToken: localStorage.getItem('adminToken') || null,
  adminUser: localStorage.getItem('adminUser') || null,
  isAuthenticated: !!localStorage.getItem('adminToken'),
  error: null,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', data.username);

      set({
        adminToken: data.token,
        adminUser: data.username,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return true;
    } catch (err) {
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to connect to the authentication server.' 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({
      adminToken: null,
      adminUser: null,
      isAuthenticated: false,
      error: null
    });
  },

  clearError: () => set({ error: null })
}));
