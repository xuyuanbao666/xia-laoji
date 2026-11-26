import api from './api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
} from '../types';

type AuthPayload = AuthResponse | { success: boolean; data: AuthResponse };

function readAuth(payload: AuthPayload): AuthResponse {
  const result = 'data' in payload ? payload.data : payload;
  if (!result || typeof result.token !== 'string' || !result.token || !result.user || typeof result.user._id !== 'string') {
    throw new Error('Invalid authentication response');
  }
  return result;
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthPayload>('/auth/login', data);
  return readAuth(response.data);
};

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthPayload>('/auth/register', data);
  return readAuth(response.data);
};

/**
 * 获取当前用户信息
 */
export const getProfile = async (): Promise<User> => {
  const response = await api.get<{ data: { user: User } }>('/auth/profile');
  return response.data.data.user;
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
  const response = await api.post<AuthPayload>('/auth/refresh', { refreshToken });
  return readAuth(response.data);
};

/**
 * 退出登录
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};
