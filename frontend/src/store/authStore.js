import { create } from 'zustand';
import { authAPI } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('fakeshield_user') || 'null'),
  token: localStorage.getItem('fakeshield_token') || null,
  refreshToken: localStorage.getItem('fakeshield_refresh_token') || null,
  isLoading: false,
  error: null,

  get isAuthenticated() {
    return !!get().token;
  },

  fetchProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      const profile = response.data;
      localStorage.setItem('fakeshield_user', JSON.stringify(profile));
      set({ user: profile });
      return profile;
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      return null;
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('fakeshield_token');
    if (token) {
      await get().fetchProfile();
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ username, password });
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('fakeshield_token', access_token);
      localStorage.setItem('fakeshield_refresh_token', refresh_token);

      set({
        token: access_token,
        refreshToken: refresh_token,
        isLoading: false,
        error: null,
      });

      // Fetch full profile info (email, role, biometrics status, created_at)
      await get().fetchProfile();
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  register: async (username, email, password, confirmPassword, faceData = null) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        username,
        email,
        password,
        confirm_password: confirmPassword,
      };
      if (faceData) {
        payload.face_data = faceData;
      }

      await authAPI.register(payload);
      // Registration successful; do NOT auto-login.
      // User must explicitly authenticate on the login page.
      set({
        isLoading: false,
        error: null,
      });
      return { success: true, username };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  loginWithFace: async (username, faceData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.loginFace({ username, face_data: faceData });
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('fakeshield_token', access_token);
      localStorage.setItem('fakeshield_refresh_token', refresh_token);

      set({
        token: access_token,
        refreshToken: refresh_token,
        isLoading: false,
        error: null,
      });

      // Fetch full profile info
      await get().fetchProfile();
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Biometric login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  loginWithGoogle: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.loginGoogle(credential);
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('fakeshield_token', access_token);
      localStorage.setItem('fakeshield_refresh_token', refresh_token);

      set({
        token: access_token,
        refreshToken: refresh_token,
        isLoading: false,
        error: null,
      });

      const profile = await get().fetchProfile();
      return { success: true, username: profile?.username || 'Google User' };
    } catch (error) {
      const message = error.response?.data?.detail || 'Google authentication failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('fakeshield_token');
    localStorage.removeItem('fakeshield_refresh_token');
    localStorage.removeItem('fakeshield_user');
    set({ user: null, token: null, refreshToken: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
