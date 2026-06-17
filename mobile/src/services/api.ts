import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types';

const API_BASE_URL = 'http://10.0.2.2:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器 - 自动附加 token
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器 - 统一处理响应和错误
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      // 可以在这里触发导航到登录页
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * 设置认证 token
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem('auth_token', token);
};

/**
 * 清除认证 token
 */
export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('refresh_token');
};

/**
 * 获取认证 token
 */
export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('auth_token');
};
