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
export const createRecord = async (data: CreateRecordRequest): Promise<DietRecord> => {
  const response = await api.post<DietRecord>('/records', data);
  return response.data;
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
export const getDailySummary = async (date: string): Promise<DailySummary> => {
  const response = await api.get<DailySummary>(`/records/daily/${date}`);
  return response.data;
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
