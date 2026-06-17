import api from './api';
import { Food, SearchFoodsResponse } from '../types';

/**
 * 搜索食物
 */
export const searchFoods = async (query: string, page = 1, limit = 20): Promise<SearchFoodsResponse> => {
  const response = await api.get('/foods', { params: { q: query, page, limit } });
  // API 返回 {success: true, data: {foods, total, page, totalPages}}
  const data = response.data?.data || response.data;
  return data;
};

/**
 * 根据 ID 获取食物详情
 */
export const getFoodById = async (id: string): Promise<Food> => {
  const response = await api.get<Food>(`/foods/${id}`);
  return response.data;
};

/**
 * 获取收藏食物列表
 */
export const getFavorites = async (): Promise<Food[]> => {
  const response = await api.get('/foods/favorites');
  const result = response.data?.data || response.data;
  return Array.isArray(result) ? result : [];
};

/**
 * 添加收藏
 */
export const addFavorite = async (foodId: string): Promise<void> => {
  await api.post(`/foods/favorites/${foodId}`);
};

/**
 * 取消收藏
 */
export const removeFavorite = async (foodId: string): Promise<void> => {
  await api.delete(`/foods/favorites/${foodId}`);
};

/**
 * 获取食物分类列表
 */
export const getCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/foods/categories');
  return response.data;
};
