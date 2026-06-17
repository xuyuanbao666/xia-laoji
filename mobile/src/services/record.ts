import api from './api';
import {
  DietRecord,
  CreateRecordRequest,
  UpdateRecordRequest,
  DailySummary,
  PaginatedResponse,
} from '../types';

/**
 * 创建饮食记录
 */
export const createRecord = async (data: any): Promise<DietRecord> => {
  // 转换为后端期望的格式
  const payload = {
    date: data.date || new Date().toISOString().split('T')[0],
    meal: data.meal,
    foods: [{
      foodId: data.foodId,
      name: data.foodName || '',
      amount: data.amount || 100,
      nutrition: data.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    }],
  };
  const response = await api.post('/records', payload);
  return response.data?.data || response.data;
};

/**
 * 获取记录列表（分页）
 */
export const getRecords = async (params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<DietRecord>> => {
  const response = await api.get<PaginatedResponse<DietRecord>>('/records', { params });
  return response.data;
};

/**
 * 获取每日摘要
 */
export const getDailySummary = async (date: string): Promise<any> => {
  const response = await api.get(`/records/daily/${date}`);
  const result = response.data?.data || response.data;
  // 转换 meals 格式为前端期望的格式
  if (result && result.meals) {
    const mealsMap: any = {};
    result.meals.forEach((meal: any) => {
      mealsMap[meal.meal] = {
        foods: meal.records?.flatMap((r: any) => r.foods) || [],
        totalCalories: meal.totalNutrition?.calories || 0,
      };
    });
    result.meals = mealsMap;
  }
  return result;
};

/**
 * 更新记录
 */
export const updateRecord = async (
  id: string,
  data: UpdateRecordRequest
): Promise<DietRecord> => {
  const response = await api.put<DietRecord>(`/records/${id}`, data);
  return response.data;
};

/**
 * 删除记录
 */
export const deleteRecord = async (id: string): Promise<void> => {
  await api.delete(`/records/${id}`);
};
