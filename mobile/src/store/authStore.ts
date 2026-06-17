import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, RegisterRequest } from '../types';
import * as authService from '../services/auth';
import { setAuthToken, clearAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(data);
      const token = result.token || result.data?.token;
      const user = result.user || result.data?.user;
      await setAuthToken(token);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || '登录失败，请重试';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(data);
      const token = result.token || result.data?.token;
      const user = result.user || result.data?.user;
      await setAuthToken(token);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || '注册失败，请重试';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // 即使接口调用失败，也清除本地状态
    } finally {
      await clearAuthToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await clearAuthToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      console.log('=== Update Profile Data ===', JSON.stringify(data, null, 2));
      const user = await authService.updateProfile(data as any);
      console.log('=== Update Profile Result ===', JSON.stringify(user, null, 2));
      set({
        user,
        isLoading: false,
      });
    } catch (error: any) {
      console.log('=== Update Profile Error ===', error.message, error.response?.data);
      const message = error.response?.data?.error?.message || error.response?.data?.message || '更新失败，请重试';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
