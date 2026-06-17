import api from './api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
} from '../types';

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

/**
 * 用户注册
 */
export const register = async (data: any): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data.data || response.data;
};

/**
 * 获取当前用户信息
 */
export const getProfile = async (): Promise<User> => {
  const response = await api.get<User>('/auth/profile');
  return response.data;
};

/**
 * 更新用户资料
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  const response = await api.put('/auth/profile', data);
  const result = response.data;
  return result?.data?.user || result?.data || result?.user || result;
};

/**
 * 刷新 token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return response.data;
};

/**
 * 退出登录
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};
